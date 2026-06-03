import React, { useState } from 'react';
import { Text, Image, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, Toast } from '@ant-design/react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '@/css/profile/caseAdd';
import DashedBorderBox from '../components/DashedBorderBox';
import { AppTheme } from '@/common/theme';
import { addMedicalRecord, aiIdentifyMedicalRecord, type MedicalRecord, type MedicalRecordAttachment, } from '@/api/medicalRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_LIST = [
    { label: '门诊', value: '门诊' },
    { label: '住院', value: '住院' },
    { label: '体检', value: '体检' },
    { label: '其他', value: '其他' },
];

const KS_LIST = [
    '心血管内科',
    '神经内科',
    '内分泌科',
    '消化内科',
    '呼吸内科',
    '肾脏内科',
];

function applyRecordToForm(record: MedicalRecord, setters: {
    setType: (v: string) => void;
    setRecordDate: (v: string) => void;
    setHospital: (v: string) => void;
    setDepartment: (v: string) => void;
    setDiagnosticResult: (v: string) => void;
    setDoctor: (v: string) => void;
    setMedicalSummary: (v: string) => void;
    setAttachments: (v: MedicalRecordAttachment[]) => void;
}) {
    if (record.medicalRecordType) setters.setType(record.medicalRecordType);
    if (record.recordDate) setters.setRecordDate(record.recordDate);
    if (record.hospital) setters.setHospital(record.hospital);
    if (record.medicalDepartment) setters.setDepartment(record.medicalDepartment);
    if (record.diagnosticResult) setters.setDiagnosticResult(record.diagnosticResult);
    if (record.doctor) setters.setDoctor(record.doctor);
    if (record.medicalSummary) setters.setMedicalSummary(record.medicalSummary);
    if (record.attachmentList?.length) setters.setAttachments(record.attachmentList);
}

async function pickImage(source: 'camera' | 'library') {
    const permission =
        source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
        Alert.alert('提示', source === 'camera' ? '需要相机权限' : '需要相册权限');
        return null;
    }

    const result =
        source === 'camera'
            ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
            : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const name = asset.fileName ?? `medical_${Date.now()}.jpg`;
    const type = asset.mimeType ?? 'image/jpeg';
    return { uri: asset.uri, name, type };
}

export default function CaseAddPage() {
    const navigation = useNavigation<Nav>();
    const [type, setType] = useState('门诊');
    const [recordDate, setRecordDate] = useState(moment().format('YYYY-MM-DD'));
    const [hospital, setHospital] = useState('');
    const [department, setDepartment] = useState('');
    const [diagnosticResult, setDiagnosticResult] = useState('');
    const [doctor, setDoctor] = useState('');
    const [medicalSummary, setMedicalSummary] = useState('');
    const [attachments, setAttachments] = useState<MedicalRecordAttachment[]>([]);
    const [identifying, setIdentifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const formSetters = {
        setType,
        setRecordDate,
        setHospital,
        setDepartment,
        setDiagnosticResult,
        setDoctor,
        setMedicalSummary,
        setAttachments,
    };

    const identifyFromImage = async (source: 'camera' | 'library') => {
        const file = await pickImage(source);
        if (!file) return;

        setIdentifying(true);
        const loadingKey = Toast.loading('病例识别中', 0);
        try {
            const res = await aiIdentifyMedicalRecord(file);
            const data = apiResourceData<MedicalRecord>(res as { code?: number; data?: MedicalRecord });
            if (data) {
                applyRecordToForm(data, formSetters);
                Alert.alert('识别成功', '已自动填充病例信息，请核对后保存');
            } else {
                const r = res as { msg?: string; message?: string };
                Alert.alert('识别失败', r.msg ?? r.message ?? '请手动填写');
            }
        } catch {
            Alert.alert('错误', '识别失败，请稍后重试');
        } finally {
            Toast.remove(loadingKey);
            setIdentifying(false);
        }
    };

    const pickAttachment = async () => {
        const file = await pickImage('library');
        if (!file) return;

        setIdentifying(true);
        const loadingKey = Toast.loading('病例识别中', 0);
        try {
            const res = await aiIdentifyMedicalRecord(file);
            const data = apiResourceData<MedicalRecord>(res as { code?: number; data?: MedicalRecord });
            if (data?.attachmentList?.length) {
                setAttachments(prev => [...prev, ...data.attachmentList!]);
            } else if (data) {
                applyRecordToForm(data, formSetters);
            }
            Alert.alert('提示', data ? '附件已处理' : '上传失败');
        } catch {
            Alert.alert('错误', '上传失败，请稍后重试');
        } finally {
            Toast.remove(loadingKey);
            setIdentifying(false);
        }
    };

    const submit = async () => {
        if (!hospital.trim()) {
            Alert.alert('提示', '请输入医院名称');
            return;
        }
        if (!diagnosticResult.trim()) {
            Alert.alert('提示', '请输入诊断结果');
            return;
        }

        setSubmitting(true);
        try {
            const res = await addMedicalRecord({
                medicalRecordType: type,
                recordDate,
                hospital: hospital.trim(),
                medicalDepartment: department.trim() || undefined,
                diagnosticResult: diagnosticResult.trim(),
                doctor: doctor.trim() || undefined,
                medicalSummary: medicalSummary.trim() || undefined,
                attachmentList: attachments.length ? attachments : undefined,
            });

            if (isResourceApiOk(res as { code?: number })) {
                navigation.goBack();
                return;
            } else {
                const r = res as { msg?: string; message?: string };
                Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
            }
        } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>个人信息</Text>
                <Flex justify="between" style={styles.cameraBoxRow}>
                    <TouchableOpacity style={styles.cameraBox} onPress={() => identifyFromImage('camera')} disabled={identifying}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/camera.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>拍照识别</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cameraBox} onPress={() => identifyFromImage('library')} disabled={identifying}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/upload.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>上传照片</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                </Flex>
                <Text style={styles.sectionTitle}>手动录入</Text>

                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>就诊类型</Text>
                        <Flex justify="between" style={styles.rowContent}>
                            {TYPE_LIST.map(item => (
                                <TouchableOpacity
                                    style={[styles.typeItem, type === item.value && styles.typeItemActive]}
                                    key={item.value}
                                    onPress={() => setType(item.value)}>
                                    <Flex style={{ flex: 1 }}>
                                        <Text style={[styles.typeItemText, type === item.value && styles.typeItemTextActive]}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>
                    <View style={styles.rowLine} />

                    <Flex justify="between">
                        <Text style={styles.rowTitle}>就诊日期</Text>
                        <TextInput
                            style={styles.dateInput}
                            value={recordDate}
                            onChangeText={setRecordDate}
                            placeholder="yyyy-MM-dd"
                            placeholderTextColor={AppTheme.textSecondary}
                        />
                    </Flex>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>医院名称</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="请输入医院名称"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={hospital}
                            onChangeText={setHospital}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>就诊科室</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="请输入科室"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={department}
                            onChangeText={setDepartment}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <ScrollView horizontal style={styles.ksList} showsHorizontalScrollIndicator={false}>
                        {KS_LIST.map(item => (
                            <TouchableOpacity
                                style={[styles.ksItem, department === item && styles.ksItemActive]}
                                key={item}
                                onPress={() => setDepartment(item)}>
                                <Flex style={{ flex: 1 }}>
                                    <Text style={[styles.ksItemText, department === item && styles.ksItemTextActive]}>{item}</Text>
                                </Flex>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View>
                        <Text style={styles.rowTitle}>诊断结果</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="请输入诊断结果"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={diagnosticResult}
                            onChangeText={setDiagnosticResult}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>主治医生（选填）</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="请输入医生姓名"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={doctor}
                            onChangeText={setDoctor}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>病情摘要（选填）</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="简要描述病情和治疗情况"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={medicalSummary}
                            onChangeText={setMedicalSummary}
                            multiline
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>上传附件（选填）</Text>
                        <Text style={styles.uploadHint}>点击上传检查报告、处方等</Text>
                        <TouchableOpacity style={styles.uploadIcon} onPress={pickAttachment} disabled={identifying}>
                            <Flex style={{ flex: 1 }} justify="center" align="center">
                                <MaterialIcons name="add" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                        {attachments.length > 0 ? (
                            <Text style={styles.uploadHint}>已添加 {attachments.length} 个附件</Text>
                        ) : null}
                    </View>
                </View>

            
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting || identifying}>
                    <Flex justify="center" align="center" style={{ flex: 1 }}>
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.addText}>添加病例</Text>
                        )}
                    </Flex>
                </TouchableOpacity>
        </SafeAreaView>
    );
}

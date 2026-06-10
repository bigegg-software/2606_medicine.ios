import React, { useCallback, useState } from 'react';
import { Text, Image, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, Toast, Modal } from '@ant-design/react-native';
import * as DocumentPicker from 'expo-document-picker';
import moment from 'moment';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '@/css/profile/caseAdd';
import DashedBorderBox from './components/DashedBorderBox';
import { AppTheme } from '@/common/theme';
import { addMedicalRecord, aiIdentifyMedicalRecords, type MedicalRecord, type MedicalRecordAttachment } from '@/api/medicalRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import { consumePendingAttachments } from '@/src/utils/attachmentUploadSession';
import { consumePendingIdentifyRecord } from '@/src/utils/medicalRecordIdentifySession';
import { uploadFileToAttachment } from '@/src/utils/uploadAttachment';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

function sanitizeFileName(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;
    const namePart = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
    const ext = hasExtension ? fileName.slice(lastDotIndex) : '';
    return (
        namePart
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '') + ext
    );
}

function isImageAttachment(att: MedicalRecordAttachment) {
    const name = att.originalName ?? att.ossUrl ?? '';
    return /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(name);
}

const TYPE_LIST = [
    { label: '门诊', value: '门诊' },
    { label: '急诊', value: '急诊' },
    { label: '住院', value: '住院' },
    { label: '体检', value: '体检' },
    { label: '复诊', value: '复诊' },
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

type FormSetters = {
    setType: (v: string) => void;
    setRecordDate: (v: string) => void;
    setHospital: (v: string) => void;
    setDepartment: (v: string) => void;
    setDiagnosticResult: (v: string) => void;
    setDoctor: (v: string) => void;
    setChiefComplaint: (v: string) => void;
    setPresentIllness: (v: string) => void;
    setPastMedicalHistory: (v: string) => void;
    setPersonalHistory: (v: string) => void;
    setPhysicalExamination: (v: string) => void;
    setPreviousExaminationResults: (v: string) => void;
    setMedicalSummary: (v: string) => void;
    setAttachments: (v: MedicalRecordAttachment[]) => void;
};

function applyRecordToForm(record: MedicalRecord, setters: FormSetters) {
    if (record.medicalRecordType) setters.setType(record.medicalRecordType);
    if (record.recordDate) setters.setRecordDate(record.recordDate);
    if (record.hospital) setters.setHospital(record.hospital);
    if (record.medicalDepartment) setters.setDepartment(record.medicalDepartment);
    if (record.diagnosticResult) setters.setDiagnosticResult(record.diagnosticResult);
    if (record.doctor) setters.setDoctor(record.doctor);
    if (record.chiefComplaint) setters.setChiefComplaint(record.chiefComplaint);
    if (record.presentIllness) setters.setPresentIllness(record.presentIllness);
    if (record.pastMedicalHistory) setters.setPastMedicalHistory(record.pastMedicalHistory);
    if (record.personalHistory) setters.setPersonalHistory(record.personalHistory);
    if (record.physicalExamination) setters.setPhysicalExamination(record.physicalExamination);
    if (record.previousExaminationResults) setters.setPreviousExaminationResults(record.previousExaminationResults);
    if (record.medicalSummary) setters.setMedicalSummary(record.medicalSummary);
}

async function pickDocumentForIdentify(
    onSuccess: (record: MedicalRecord) => void,
    onError: (message: string) => void,
) {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: DOCUMENT_TYPES,
            copyToCacheDirectory: true,
            multiple: true,
        });
        if (result.canceled || !result.assets?.length) {
            return;
        }

        const files = result.assets.map((asset, index) => ({
            uri: asset.uri,
            name: sanitizeFileName(asset.name ?? `document_${Date.now()}_${index}`),
            type: asset.mimeType ?? 'application/octet-stream',
        }));
        const res = await aiIdentifyMedicalRecords(files);
        const data = apiResourceData<MedicalRecord>(res as { code?: number; data?: MedicalRecord });
        if (data) {
            onSuccess(data);
            return;
        }
        const r = res as { msg?: string; message?: string };
        onError(r.msg ?? r.message ?? '请手动填写');
    } catch {
        onError('识别失败，请稍后重试');
    }
}

type TextareaFieldProps = {
    title: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    optional?: boolean;
};

function TextareaField({ title, placeholder, value, onChangeText, optional }: TextareaFieldProps) {
    return (
        <>
            <View>
                <Text style={styles.rowTitle}>{optional ? `${title}（选填）` : title}</Text>
                <TextInput
                    style={styles.textareaBox}
                    placeholder={placeholder}
                    placeholderTextColor={AppTheme.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    multiline
                    textAlignVertical="top"
                    inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                />
            </View>
            <View style={styles.rowLine} />
        </>
    );
}

export default function CaseAddPage() {
    const navigation = useNavigation<Nav>();
    const [type, setType] = useState('门诊');
    const [recordDate, setRecordDate] = useState(moment().format('YYYY-MM-DD'));
    const [hospital, setHospital] = useState('');
    const [department, setDepartment] = useState('');
    const [diagnosticResult, setDiagnosticResult] = useState('');
    const [doctor, setDoctor] = useState('');
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [presentIllness, setPresentIllness] = useState('');
    const [pastMedicalHistory, setPastMedicalHistory] = useState('');
    const [personalHistory, setPersonalHistory] = useState('');
    const [physicalExamination, setPhysicalExamination] = useState('');
    const [previousExaminationResults, setPreviousExaminationResults] = useState('');
    const [medicalSummary, setMedicalSummary] = useState('');
    const [attachments, setAttachments] = useState<MedicalRecordAttachment[]>([]);
    const [identifying, setIdentifying] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [pickingDocument, setPickingDocument] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const record = consumePendingIdentifyRecord();
            if (record) {
                applyRecordToForm(record, formSetters);
                Alert.alert('识别成功', '已自动填充病例信息，请核对后保存');
            }
            const items = consumePendingAttachments();
            if (items.length) {
                setAttachments(prev => [...prev, ...items]);
            }
        }, []),
    );

    const formSetters: FormSetters = {
        setType,
        setRecordDate,
        setHospital,
        setDepartment,
        setDiagnosticResult,
        setDoctor,
        setChiefComplaint,
        setPresentIllness,
        setPastMedicalHistory,
        setPersonalHistory,
        setPhysicalExamination,
        setPreviousExaminationResults,
        setMedicalSummary,
        setAttachments,
    };

    const identifyFromDocuments = async () => {
        setIdentifying(true);
        const loadingKey = Toast.loading('病例识别中', 0);
        try {
            await pickDocumentForIdentify(
                data => {
                    applyRecordToForm(data, formSetters);
                    Alert.alert('识别成功', '已自动填充病例信息，请核对后保存');
                },
                message => Alert.alert('识别失败', message),
            );
        } finally {
            Toast.remove(loadingKey);
            setIdentifying(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const pickDocument = async () => {
        setUploadModalVisible(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: DOCUMENT_TYPES,
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            const asset = result.assets[0];
            setPickingDocument(true);
            const loadingKey = Toast.loading('上传中', 0);
            try {
                const item = await uploadFileToAttachment({
                    uri: asset.uri,
                    name: sanitizeFileName(asset.name ?? `document_${Date.now()}`),
                    type: asset.mimeType ?? 'application/octet-stream',
                });
                if (item) {
                    setAttachments(prev => [...prev, item]);
                    Toast.show('上传成功');
                } else {
                    Alert.alert('上传失败', '请稍后重试');
                }
            } catch {
                Alert.alert('错误', '上传失败，请稍后重试');
            } finally {
                Toast.remove(loadingKey);
                setPickingDocument(false);
            }
        } catch {
            Alert.alert('错误', '选择文件失败');
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
                chiefComplaint: chiefComplaint.trim() || undefined,
                presentIllness: presentIllness.trim() || undefined,
                pastMedicalHistory: pastMedicalHistory.trim() || undefined,
                personalHistory: personalHistory.trim() || undefined,
                physicalExamination: physicalExamination.trim() || undefined,
                previousExaminationResults: previousExaminationResults.trim() || undefined,
                medicalSummary: medicalSummary.trim() || undefined,
                attachmentList: attachments.length ? attachments : undefined,
            });

            if (isResourceApiOk(res as { code?: number })) {
                navigation.goBack();
                return;
            }
            const r = res as { msg?: string; message?: string };
            Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
        } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>拍照识别</Text>
                <Flex justify="between" style={styles.cameraBoxRow}>
                    <TouchableOpacity
                        style={styles.cameraBox}
                        onPress={() => navigation.navigate('CaseCameraPage', { mode: 'identify' })}
                        disabled={identifying}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/camera.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>拍照识别</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cameraBox}
                        onPress={() => navigation.navigate('CaseAlbumPage', { mode: 'identify' })}
                        disabled={identifying}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/upload.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>上传照片</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cameraBox} onPress={identifyFromDocuments} disabled={identifying}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/file-upload.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>上传文件</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                </Flex>
                <Text style={styles.sectionTitle}>手动录入</Text>

                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>就诊类型</Text>
                        <Flex wrap="wrap" style={{ marginBottom: 12, gap: 8 }}>
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
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <TextareaField
                        title="主诉"
                        placeholder="请输入主诉"
                        value={chiefComplaint}
                        onChangeText={setChiefComplaint}
                    />
                    <TextareaField
                        title="现病史"
                        placeholder="请输入现病史"
                        value={presentIllness}
                        onChangeText={setPresentIllness}
                    />
                    <TextareaField
                        title="既往史"
                        placeholder="请输入既往史"
                        value={pastMedicalHistory}
                        onChangeText={setPastMedicalHistory}
                    />
                    <TextareaField
                        title="个人史"
                        placeholder="请输入个人史"
                        value={personalHistory}
                        onChangeText={setPersonalHistory}
                    />
                    <TextareaField
                        title="体格检查"
                        placeholder="请输入体格检查结果"
                        value={physicalExamination}
                        onChangeText={setPhysicalExamination}
                    />
                    <TextareaField
                        title="既往检查结果"
                        placeholder="请输入既往检查结果"
                        value={previousExaminationResults}
                        onChangeText={setPreviousExaminationResults}
                    />
                    <TextareaField
                        title="病情摘要"
                        placeholder="简要描述病情和治疗情况"
                        value={medicalSummary}
                        onChangeText={setMedicalSummary}
                        optional
                    />

                    <View>
                        <Text style={styles.rowTitle}>上传附件（选填）</Text>
                        <Text style={styles.uploadHint}>点击上传检查报告、处方等</Text>
                        <View style={styles.attachmentList}>
                            {attachments.map((att, index) => (
                                <View key={`${att.ossId ?? att.ossUrl}-${index}`} style={styles.attachmentItem}>
                                    {att.ossUrl && isImageAttachment(att) ? (
                                        <Image source={{ uri: att.ossUrl }} style={styles.attachmentImg} />
                                    ) : (
                                        <Flex style={styles.attachmentImg} justify="center" align="center">
                                            <MaterialIcons name="description" size={28} color={AppTheme.textSecondary} />
                                        </Flex>
                                    )}
                                    <TouchableOpacity
                                        style={styles.attachmentRemove}
                                        onPress={() => removeAttachment(index)}>
                                        <MaterialIcons name="close" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={styles.uploadIcon}
                                onPress={() => setUploadModalVisible(true)}
                                disabled={identifying || pickingDocument}>
                                <Flex style={{ flex: 1 }} justify="center" align="center">
                                    {pickingDocument ? (
                                        <ActivityIndicator size="small" color={AppTheme.textSecondary} />
                                    ) : (
                                        <MaterialIcons name="add" size={24} color={AppTheme.textSecondary} />
                                    )}
                                </Flex>
                            </TouchableOpacity>
                        </View>
                        {attachments.length > 0 ? (
                            <Text style={styles.uploadHint}>已添加 {attachments.length} 个附件</Text>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
            <Modal
                popup
                style={styles.uploadModal}
                visible={uploadModalVisible}
                maskClosable
                animationType="slide-up"
                onClose={() => setUploadModalVisible(false)}>
                <View style={styles.uploadModalBox}>
                    <Flex justify="around">
                        <TouchableOpacity
                            style={styles.uploadModalItem}
                            onPress={() => {
                                setUploadModalVisible(false);
                                navigation.navigate('CaseAlbumPage');
                            }}>
                            <Image
                                style={styles.uploadModalImg}
                                source={require('@/assets/images/camara/type_images.png')}
                            />
                            <Text style={styles.uploadModalTitle}>相册</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadModalItem} onPress={pickDocument}>
                            <Image
                                style={styles.uploadModalImg}
                                source={require('@/assets/images/camara/type_documents.png')}
                            />
                            <Text style={styles.uploadModalTitle}>文件</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.uploadModalItem}
                            onPress={() => {
                                setUploadModalVisible(false);
                                navigation.navigate('CaseCameraPage');
                            }}>
                            <Image
                                style={styles.uploadModalImg}
                                source={require('@/assets/images/camara/type_camara.png')}
                            />
                            <Text style={styles.uploadModalTitle}>拍照</Text>
                        </TouchableOpacity>
                    </Flex>
                </View>
            </Modal>
            <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting || identifying || pickingDocument}>
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

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Text,
    Image,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    Keyboard,
    findNodeHandle,
    type FocusEvent,
    type NativeSyntheticEvent,
    type NativeScrollEvent,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Toast, DatePicker } from '@ant-design/react-native';
import * as DocumentPicker from 'expo-document-picker';
import moment from 'moment';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '@/css/profile/caseAdd';
import { AppTheme } from '@/common/theme';
import { addMedicalRecord, aiIdentifyMedicalRecords, type MedicalRecord, type MedicalRecordAttachment } from '@/api/medicalRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import { consumePendingAttachments } from '@/src/utils/attachmentUploadSession';
import { consumePendingIdentifyRecord } from '@/src/utils/medicalRecordIdentifySession';
import { uploadFileToAttachment } from '@/src/utils/uploadAttachment';
import { MEDICAL_RECORD_TYPE_LIST } from './caseConstants';
import {
    getAttachmentDisplayName,
    getAttachmentExtLabel,
    partitionAttachments,
} from './medicalRecordAttachmentHelpers';
import { resolveAttachmentsAfterIdentify } from './utils/identifyAttachmentHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CASE_ADD_ACCESSORY = {
    hospital: 'caseAddHospitalDoneToolbar',
    department: 'caseAddDepartmentDoneToolbar',
    diagnosticResult: 'caseAddDiagnosticDoneToolbar',
    doctor: 'caseAddDoctorDoneToolbar',
    chiefComplaint: 'caseAddChiefComplaintDoneToolbar',
    presentIllness: 'caseAddPresentIllnessDoneToolbar',
    pastMedicalHistory: 'caseAddPastMedicalDoneToolbar',
    personalHistory: 'caseAddPersonalHistoryDoneToolbar',
    physicalExamination: 'caseAddPhysicalExamDoneToolbar',
    previousExaminationResults: 'caseAddPreviousExamDoneToolbar',
    medicalSummary: 'caseAddMedicalSummaryDoneToolbar',
} as const;

const DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

function normalizeRecordDate(value?: string) {
    if (!value) {
        return '';
    }
    const m = moment(value, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    return m.isValid() ? m.format('YYYY-MM-DD') : value;
}

function parseRecordDate(value?: string) {
    if (!value) {
        return undefined;
    }
    const m = moment(value, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    return m.isValid() ? m.toDate() : undefined;
}

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
    if (record.recordDate) setters.setRecordDate(normalizeRecordDate(record.recordDate));
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
    onSuccess: (record: MedicalRecord, attachments: MedicalRecordAttachment[]) => void,
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
            size: asset.size,
            uploadType: 'file' as const,
        }));
        const res = await aiIdentifyMedicalRecords(files);
        const data = apiResourceData<MedicalRecord>(res as { code?: number; data?: MedicalRecord });
        if (data) {
            const attachments = await resolveAttachmentsAfterIdentify(data, files);
            onSuccess(data, attachments);
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
    topMargin?: boolean;
    onChangeText: (text: string) => void;
    onFocus?: (e: FocusEvent) => void;
    inputAccessoryViewID: string;
    optional?: boolean;
};

function TextareaField({
    title,
    placeholder,
    value,
    onChangeText,
    onFocus,
    inputAccessoryViewID,
    optional,
    topMargin = false,
}: TextareaFieldProps) {
    return (
        <View style={[styles.formSection, topMargin && { marginTop: 0 }]}>
            <Text style={styles.textareaTitle}>{optional ? `${title}（选填）` : title}</Text>
            <TextInput
                style={styles.textareaBox}
                placeholder={placeholder}
                placeholderTextColor="#999999"
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                multiline
                textAlignVertical="top"
                inputAccessoryViewID={inputAccessoryViewID}
            />
        </View>
    );
}

export default function CaseAddPage() {
    const navigation = useNavigation<Nav>();
    const scrollRef = useRef<ScrollView>(null);
    const scrollOffsetRef = useRef(0);
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
                (data, attachments) => {
                    applyRecordToForm(data, formSetters);
                    if (attachments.length) {
                        setAttachments(prev => [...prev, ...attachments]);
                    }
                    Alert.alert('识别成功', '已自动填充病例信息，请核对后保存');
                },
                message => Alert.alert('识别失败', message),
            );
        } finally {
            Toast.remove(loadingKey);
            setIdentifying(false);
        }
    };

    const removeAttachment = (target: MedicalRecordAttachment) => {
        setAttachments(prev => {
            const index = prev.findIndex(item => {
                if (target.ossId && item.ossId) return item.ossId === target.ossId;
                return Boolean(target.ossUrl) && item.ossUrl === target.ossUrl;
            });
            if (index < 0) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const { images: imageAttachments, files: fileAttachments } = useMemo(
        () => partitionAttachments(attachments),
        [attachments],
    );

    const scrollFocusedInputIntoView = useCallback((e: FocusEvent) => {
        const targetHandle = findNodeHandle(e.target as unknown as number | React.Component);
        if (targetHandle == null) return;

        setTimeout(() => {
            const scrollView = scrollRef.current as ScrollView & {
                getScrollResponder?: () => {
                    scrollResponderScrollNativeHandleToKeyboard?: (
                        nodeHandle: number,
                        additionalOffset: number,
                        preventNegativeScrollOffset?: boolean,
                    ) => void;
                };
            } | null;
            const responder = scrollView?.getScrollResponder?.();
            responder?.scrollResponderScrollNativeHandleToKeyboard?.(targetHandle, 100, true);
        }, Platform.OS === 'ios' ? 80 : 120);
    }, []);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    }, []);

    // 键盘收起时保持当前滚动位置，避免点「完成」后整页往下跳
    useFocusEffect(
        useCallback(() => {
            const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
            const sub = Keyboard.addListener(hideEvent, () => {
                const y = scrollOffsetRef.current;
                requestAnimationFrame(() => {
                    scrollRef.current?.scrollTo({ y, animated: false });
                });
            });
            return () => sub.remove();
        }, []),
    );

    const pickDocument = async () => {
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
        <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
            {Object.values(CASE_ADD_ACCESSORY).map(id => (
                <KeyboardDoneAccessory key={id} nativeID={id} />
            ))}
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}>
                <View style={styles.rowBox}>
                    <Text style={styles.sectionTitle}>拍照识别</Text>
                    <Flex justify="between" style={styles.cameraBoxRow}>
                        <TouchableOpacity
                            style={styles.cameraBoxItem}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('CaseCameraPage', { mode: 'identify' })}
                            disabled={identifying}>
                            <View style={styles.cameraBoxDash}>
                                <Image
                                    source={require('@/assets/images/case/icon_camera.png')}
                                    style={styles.cameraBoxIcon}
                                />
                                <Text style={styles.cameraBoxTitle}>拍照识别</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cameraBoxItem}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('CaseAlbumPage', { mode: 'identify' })}
                            disabled={identifying}>
                            <View style={styles.cameraBoxDash}>
                                <Image
                                    source={require('@/assets/images/case/icon_image.png')}
                                    style={styles.cameraBoxIcon}
                                />
                                <Text style={styles.cameraBoxTitle}>上传照片</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cameraBoxItem}
                            activeOpacity={0.8}
                            onPress={identifyFromDocuments}
                            disabled={identifying}>
                            <View style={styles.cameraBoxDash}>
                                <Image
                                    source={require('@/assets/images/case/icon_upload.png')}
                                    style={styles.cameraBoxIcon}
                                />
                                <Text style={styles.cameraBoxTitle}>上传文件</Text>
                            </View>
                        </TouchableOpacity>
                    </Flex>
                </View>


                <View style={styles.rowBox}>
                    <Text style={styles.sectionTitle}>手动录入</Text>

                    <View>
                        <Text style={styles.typeSectionTitle}>就诊类型</Text>
                        <Flex wrap="wrap" style={styles.typeList}>
                            {MEDICAL_RECORD_TYPE_LIST.map(item => (
                                <TouchableOpacity
                                    style={[styles.typeItem, type === item.value && styles.typeItemActive]}
                                    key={item.value}
                                    onPress={() => setType(item.value)}>
                                    <Text style={[styles.typeItemText, type === item.value && styles.typeItemTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>

                    <DatePicker
                        precision="day"
                        minDate={new Date(1900, 0, 1)}
                        maxDate={new Date()}
                        value={parseRecordDate(recordDate)}
                        onOk={date => setRecordDate(moment(date).format('YYYY-MM-DD'))}>
                        <TouchableOpacity activeOpacity={0.7} style={[styles.formRow, styles.formRowFirst]}>
                            <Text style={styles.formRowLabel}>就诊日期</Text>
                            <View style={styles.formRowValue}>
                                <Text style={styles.dateValue}>
                                    {recordDate || '请选择就诊日期'}
                                </Text>
                                <Image
                                    source={require('@/assets/images/case/icon_rl.png')}
                                    style={styles.dateIcon}
                                />
                            </View>
                        </TouchableOpacity>
                    </DatePicker>

                    <View style={styles.formRow}>
                        <Text style={styles.formRowLabel} numberOfLines={1}>医院名称</Text>
                        <TextInput
                            style={styles.formRowInput}
                            placeholder="请输入医院名称"
                            placeholderTextColor="#999999"
                            value={hospital}
                            onChangeText={setHospital}
                            onFocus={scrollFocusedInputIntoView}
                            returnKeyType="done"
                            blurOnSubmit
                            inputAccessoryViewID={CASE_ADD_ACCESSORY.hospital}
                        />
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.formRowLabel} numberOfLines={1}>就诊科室</Text>
                        <TextInput
                            style={styles.formRowInput}
                            placeholder="请输入科室"
                            placeholderTextColor="#999999"
                            value={department}
                            onChangeText={setDepartment}
                            onFocus={scrollFocusedInputIntoView}
                            returnKeyType="done"
                            blurOnSubmit
                            inputAccessoryViewID={CASE_ADD_ACCESSORY.department}
                        />
                    </View>

                    {/* <ScrollView
                        horizontal
                        style={styles.ksList}
                        contentContainerStyle={styles.ksListContent}
                        showsHorizontalScrollIndicator={false}>
                        {KS_LIST.map(item => (
                            <TouchableOpacity
                                style={[styles.ksItem, department === item && styles.ksItemActive]}
                                key={item}
                                activeOpacity={0.8}
                                onPress={() => setDepartment(item)}>
                                <Text style={[styles.ksItemText, department === item && styles.ksItemTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView> */}


                    <View style={styles.formRow}>
                        <Text style={styles.formRowLabel} numberOfLines={1}>主治医生（选填）</Text>
                        <TextInput
                            style={styles.formRowInput}
                            placeholder="请输入医生姓名"
                            placeholderTextColor="#999999"
                            value={doctor}
                            onChangeText={setDoctor}
                            onFocus={scrollFocusedInputIntoView}
                            returnKeyType="done"
                            blurOnSubmit
                            inputAccessoryViewID={CASE_ADD_ACCESSORY.doctor}
                        />
                    </View>
                    <TextareaField
                        title="主诉"
                        placeholder="请输入主诉"
                        value={chiefComplaint}
                        topMargin={true}
                        onChangeText={setChiefComplaint}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.chiefComplaint}
                    />
                    <TextareaField
                        title="现病史"
                        placeholder="请输入现病史"
                        value={presentIllness}
                        onChangeText={setPresentIllness}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.presentIllness}
                    />
                    <TextareaField
                        title="既往史"
                        placeholder="请输入既往史"
                        value={pastMedicalHistory}
                        onChangeText={setPastMedicalHistory}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.pastMedicalHistory}
                    />
                    <TextareaField
                        title="个人史"
                        placeholder="请输入个人史"
                        value={personalHistory}
                        onChangeText={setPersonalHistory}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.personalHistory}
                    />
                    <TextareaField
                        title="体格检查"
                        placeholder="请输入体格检查结果"
                        value={physicalExamination}
                        onChangeText={setPhysicalExamination}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.physicalExamination}
                    />
                    <TextareaField
                        title="既往检查结果"
                        placeholder="请输入既往检查结果"
                        value={previousExaminationResults}
                        onChangeText={setPreviousExaminationResults}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.previousExaminationResults}
                    />

                    <TextareaField
                        title="诊断结果"
                        placeholder="请输入诊断结果"
                        value={diagnosticResult}
                        onChangeText={setDiagnosticResult}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.diagnosticResult}
                    />

                    <TextareaField
                        title="病情摘要"
                        placeholder="简要描述病情和治疗情况"
                        value={medicalSummary}
                        onChangeText={setMedicalSummary}
                        onFocus={scrollFocusedInputIntoView}
                        inputAccessoryViewID={CASE_ADD_ACCESSORY.medicalSummary}
                        optional
                    />

                    <View style={styles.formSection}>
                        <Text style={styles.textareaTitle}>上传附件（选填）</Text>
                        <Text style={styles.uploadHint}>点击上传：<Text style={styles.uploadHintText}>检查报告、处方等</Text></Text>
                        {imageAttachments.length > 0 || fileAttachments.length > 0 ? (
                            <View style={styles.detailAttachmentBody}>
                                {imageAttachments.length > 0 ? (
                                    <View style={[styles.detailAttachmentList, { marginTop: 12 }]}>
                                        {imageAttachments.map((att, index) => (
                                            <View
                                                key={`img-${att.ossId ?? att.ossUrl}-${index}`}
                                                style={{ width: '31.2%', position: 'relative' }}>
                                                <View style={[styles.detailAttachmentImgWrap, { width: '100%' }]}>
                                                    <Image
                                                        source={{ uri: att.ossUrl }}
                                                        style={styles.detailAttachmentImg}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.attachmentRemove}
                                                    onPress={() => removeAttachment(att)}>
                                                    <MaterialIcons name="close" size={14} color="#FFFFFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                ) : null}
                                {fileAttachments.length > 0 ? (
                                    <View
                                        style={[
                                            styles.detailAttachmentFileList,
                                            imageAttachments.length > 0
                                                ? styles.detailAttachmentFileListGap
                                                : { marginTop: 12 },
                                        ]}>
                                        {fileAttachments.map((att, index) => (
                                            <View
                                                key={`file-${att.ossId ?? att.ossUrl}-${index}`}
                                                style={styles.detailAttachmentFileItem}>
                                                <View style={styles.detailAttachmentFileIcon}>
                                                    <Image
                                                        style={styles.detailAttachmentFileIconImg}
                                                        source={require('@/assets/images/camara/type_documents.png')}
                                                    />
                                                </View>
                                                <View style={styles.detailAttachmentFileInfo}>
                                                    <Text style={styles.detailAttachmentFileName} numberOfLines={1}>
                                                        {getAttachmentDisplayName(att)}
                                                    </Text>
                                                    <Text style={styles.detailAttachmentFileExt}>
                                                        {getAttachmentExtLabel(att)}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={() => removeAttachment(att)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                    <MaterialIcons name="close" size={18} color="#999999" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                ) : null}
                            </View>
                        ) : null}
                        <Flex justify="between" style={styles.cameraBoxRow}>
                            <TouchableOpacity
                                style={styles.cameraBoxItem}
                                activeOpacity={0.8}
                                disabled={identifying || pickingDocument}
                                onPress={() => navigation.navigate('CaseCameraPage')}>
                                <View style={styles.cameraBoxDash}>
                                    <Image
                                        source={require('@/assets/images/case/icon_camera.png')}
                                        style={styles.cameraBoxIcon}
                                    />
                                    <Text style={styles.cameraBoxTitle}>拍照</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cameraBoxItem}
                                activeOpacity={0.8}
                                disabled={identifying || pickingDocument}
                                onPress={() => navigation.navigate('CaseAlbumPage')}>
                                <View style={styles.cameraBoxDash}>
                                    <Image
                                        source={require('@/assets/images/case/icon_image.png')}
                                        style={styles.cameraBoxIcon}
                                    />
                                    <Text style={styles.cameraBoxTitle}>上传照片</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cameraBoxItem}
                                activeOpacity={0.8}
                                disabled={identifying || pickingDocument}
                                onPress={pickDocument}>
                                <View style={styles.cameraBoxDash}>
                                    {pickingDocument ? (
                                        <ActivityIndicator size="small" color={AppTheme.textSecondary} />
                                    ) : (
                                        <>
                                            <Image
                                                source={require('@/assets/images/case/icon_upload.png')}
                                                style={styles.cameraBoxIcon}
                                            />
                                            <Text style={styles.cameraBoxTitle}>上传文件</Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </Flex>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.bottomBarButtonLeft, (submitting || identifying || pickingDocument) && { opacity: 0.6 }]}
                    activeOpacity={0.7}
                    disabled={submitting || identifying || pickingDocument}
                    onPress={submit}>
                    <Flex style={{ flex: 1 }}>
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Image
                                    style={styles.bottomBarButtonImg}
                                    source={require('@/assets/images/schedule/save.png')}
                                />
                                <Text style={styles.bottomBarButtonTextLeft}>添加病例</Text>
                            </>
                        )}
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}

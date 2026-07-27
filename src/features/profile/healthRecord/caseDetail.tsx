import React, { useEffect, useMemo, useState } from 'react';
import {
    Text,
    Image,
    ImageBackground,
    View,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Toast } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMedicalRecordInfo, type MedicalRecord, type MedicalRecordAttachment } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/caseAdd';
import caseStyles from '@/css/profile/healthRecord';
import { apiResourceData } from '@/src/utils/apiHelpers';
import {
    getAttachmentDisplayName,
    getAttachmentExtLabel,
    isImageAttachment,
    partitionAttachments,
} from './medicalRecordAttachmentHelpers';
import { formatCaseNoteDate, getCaseTypeTagColors } from './utils/caseNotesHelpers';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import type { RootStackParamList } from '@/route/router';

type Props = NativeStackScreenProps<RootStackParamList, 'CaseDetail'>;

const TEXT_SECTIONS: { key: keyof MedicalRecord; title: string }[] = [
    { key: 'chiefComplaint', title: '主诉' },
    { key: 'presentIllness', title: '现病史' },
    { key: 'pastMedicalHistory', title: '既往史' },
    { key: 'personalHistory', title: '个人史' },
    { key: 'physicalExamination', title: '体格检查' },
    { key: 'previousExaminationResults', title: '既往检查结果' },
    { key: 'medicalSummary', title: '病情摘要' },
];

function displayValue(value?: string | number | null) {
    if (value == null || String(value).trim() === '') {
        return '暂无';
    }
    return String(value);
}

function CaseDetailHeader({ record }: { record: MedicalRecord }) {
    const typeLabel = record.medicalRecordType?.trim();
    const tagColors = getCaseTypeTagColors(typeLabel);

    return (
        <View style={[caseStyles.caseBox, styles.detailHeaderBox]}>
            <Flex justify="between" align="center">
                <Flex align="center" style={caseStyles.caseTitleWrap}>
                    <Text style={caseStyles.caseTitle} numberOfLines={1}>
                        {record.diagnosticResult || '未填写诊断'}
                    </Text>
                    {typeLabel ? (
                        <View
                            style={[
                                caseStyles.caseTypeTag,
                                {
                                    backgroundColor: tagColors.backgroundColor,
                                    borderColor: tagColors.borderColor,
                                },
                            ]}>
                            <Text style={[caseStyles.caseTypeTagText, { color: tagColors.color }]}>
                                {typeLabel}
                            </Text>
                        </View>
                    ) : null}
                </Flex>
                <Text style={caseStyles.caseTime}>{formatCaseNoteDate(record.recordDate)}</Text>
            </Flex>
            <View style={caseStyles.caseLineWrap}>
                <View style={caseStyles.caseLine} />
            </View>
            <View style={caseStyles.caseContentBox}>
                <Text style={caseStyles.caseContentText} numberOfLines={1}>
                    <Text style={caseStyles.caseContentLabel}>就诊医院：</Text>
                    <Text style={caseStyles.caseContentValue}>
                        {[record.hospital, record.medicalDepartment].filter(Boolean).join('·') || '—'}
                    </Text>
                </Text>
                <Text style={[caseStyles.caseContentText, caseStyles.caseContentTextSecond]} numberOfLines={1}>
                    <Text style={caseStyles.caseContentLabel}>主治医师：</Text>
                    <Text style={caseStyles.caseContentValue}>{record.doctor || '—'}</Text>
                </Text>
            </View>
        </View>
    );
}

function DetailSection({
    title,
    content,
    showDivider,
}: {
    title: string;
    content?: string;
    showDivider?: boolean;
}) {
    return (
        <View>
            <Flex align="center">
                <View style={styles.detailSectionBar} />
                <Text style={styles.detailSectionTitle}>{title}</Text>
            </Flex>
            <Text style={styles.detailSectionContent}>{displayValue(content)}</Text>
            {showDivider ? <View style={styles.detailSectionDivider} /> : null}
        </View>
    );
}

function sanitizeFileName(fileName: string) {
    return fileName.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'file';
}

export async function openRemoteFile(url: string, fileName: string) {
    const safeName = sanitizeFileName(fileName);
    const localPath = `${RNFS.DocumentDirectoryPath}/${Date.now()}_${safeName}`;

    const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
    }).promise;

    if (downloadResult.statusCode !== 200) {
        throw new Error('download failed');
    }

    await FileViewer.open(localPath);
}

async function openAttachment(att: MedicalRecordAttachment) {
    if (!att.ossUrl) {
        Alert.alert('提示', '文件地址无效');
        return;
    }

    const loadingKey = Toast.loading('加载中', 0);
    try {
        await openRemoteFile(att.ossUrl, getAttachmentDisplayName(att));
    } catch {
        Alert.alert('提示', '打开文件失败');
    } finally {
        Toast.remove(loadingKey);
    }
}

function AttachmentPreviewItem({ att, index }: { att: MedicalRecordAttachment; index: number }) {
    if (!att.ossUrl) {
        return null;
    }

    const displayName = getAttachmentDisplayName(att);

    if (isImageAttachment(att)) {
        return (
            <TouchableOpacity
                key={`${att.ossId ?? att.ossUrl}-${index}`}
                activeOpacity={0.8}
                style={styles.detailAttachmentImgWrap}
                onPress={() => openAttachment(att)}>
                <Image source={{ uri: att.ossUrl }} style={styles.detailAttachmentImg} resizeMode="cover" />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            key={`${att.ossId ?? att.ossUrl}-${index}`}
            activeOpacity={0.8}
            style={styles.detailAttachmentFileItem}
            onPress={() => openAttachment(att)}>
            <View style={styles.detailAttachmentFileIcon}>
                <Image
                    style={styles.detailAttachmentFileIconImg}
                    source={require('@/assets/images/camara/type_documents.png')}
                />
            </View>
            <View style={styles.detailAttachmentFileInfo}>
                <Text style={styles.detailAttachmentFileName} numberOfLines={1}>
                    {displayName}
                </Text>
                <Text style={styles.detailAttachmentFileExt}>{getAttachmentExtLabel(att)}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#999999" />
        </TouchableOpacity>
    );
}

export default function CaseDetailPage({ route }: Props) {
    const { id } = route.params;
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getMedicalRecordInfo(id);
                setRecord(apiResourceData<MedicalRecord>(res as { code?: number; data?: MedicalRecord }) ?? null);
            } catch {
                setRecord(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const { images: imageAttachments, files: fileAttachments } = useMemo(
        () => partitionAttachments(record?.attachmentList ?? []),
        [record?.attachmentList],
    );
    const hasAttachments = imageAttachments.length > 0 || fileAttachments.length > 0;

    if (loading) {
        return (
            <PageLayout style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    if (!record) {
        return (
            <PageLayout style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: AppTheme.textSecondary }}>暂无病例详情</Text>
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} showHeaderBackground={false}>
            <ScrollView contentContainerStyle={[styles.body, { paddingHorizontal: 0 }]} keyboardShouldPersistTaps="handled">
                <CaseDetailHeader record={record} />

                <View style={styles.detailBlock}>
                    <ImageBackground
                        source={require('@/assets/images/schedule/calendarBack.png')}
                        style={styles.backImage1}>
                        <Flex align="center" style={{ flex: 1, paddingHorizontal: 27 }}>
                            <Text style={styles.backImage1Text}>病例详情</Text>
                        </Flex>
                    </ImageBackground>
                    <View style={styles.detailContentCard}>
                        {TEXT_SECTIONS.map((section, index) => (
                            <View
                                key={section.key}
                                style={index > 0 ? styles.detailSectionNext : undefined}>
                                <DetailSection
                                    title={section.title}
                                    content={record[section.key] as string | undefined}
                                    showDivider
                                />
                            </View>
                        ))}

                        <View style={styles.detailSectionNext}>
                            <Flex align="center">
                                <View style={styles.detailSectionBar} />
                                <Text style={styles.detailSectionTitle}>附件</Text>
                                {hasAttachments ? (
                                    <Text style={styles.detailAttachmentCount}>
                                        {imageAttachments.length + fileAttachments.length}
                                    </Text>
                                ) : null}
                            </Flex>
                            <View style={styles.detailAttachmentBody}>
                                {hasAttachments ? (
                                    <>
                                        {imageAttachments.length > 0 ? (
                                            <View style={styles.detailAttachmentList}>
                                                {imageAttachments.map((att, index) => (
                                                    <AttachmentPreviewItem
                                                        key={`img-${att.ossId ?? att.ossUrl}-${index}`}
                                                        att={att}
                                                        index={index}
                                                    />
                                                ))}
                                            </View>
                                        ) : null}
                                        {fileAttachments.length > 0 ? (
                                            <View
                                                style={[
                                                    styles.detailAttachmentFileList,
                                                    imageAttachments.length > 0 && styles.detailAttachmentFileListGap,
                                                ]}>
                                                {fileAttachments.map((att, index) => (
                                                    <AttachmentPreviewItem
                                                        key={`file-${att.ossId ?? att.ossUrl}-${index}`}
                                                        att={att}
                                                        index={index}
                                                    />
                                                ))}
                                            </View>
                                        ) : null}
                                    </>
                                ) : (
                                    <Text style={styles.detailAttachmentEmpty}>暂无附件</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </PageLayout>
    );
}

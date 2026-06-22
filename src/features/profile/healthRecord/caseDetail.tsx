import React, { useEffect, useMemo, useState } from 'react';
import { Text, Image, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert, type ImageSourcePropType, } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Toast } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMedicalRecordInfo, type MedicalRecord, type MedicalRecordAttachment } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/caseAdd';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { getAttachmentDisplayName, isImageAttachment, partitionAttachments, } from './medicalRecordAttachmentHelpers';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { RootStackParamList } from '@/route/router';

type Props = NativeStackScreenProps<RootStackParamList, 'CaseDetail'>;

const TEXT_SECTIONS: { key: keyof MedicalRecord; title: string; icon: ImageSourcePropType }[] = [
    { key: 'chiefComplaint', title: '主诉', icon: require('@/assets/images/user/zs.png') },
    { key: 'presentIllness', title: '现病史', icon: require('@/assets/images/user/xbs.png') },
    { key: 'pastMedicalHistory', title: '既往史', icon: require('@/assets/images/user/jws.png') },
    { key: 'personalHistory', title: '个人史', icon: require('@/assets/images/user/jws.png') },
    { key: 'physicalExamination', title: '体格检查', icon: require('@/assets/images/user/tgjc.png') },
    { key: 'previousExaminationResults', title: '既往检查结果', icon: require('@/assets/images/user/fdj.png') },
    { key: 'medicalSummary', title: '病情摘要', icon: require('@/assets/images/user/zd.png') },
];

function displayValue(value?: string | number | null) {
    if (value == null || String(value).trim() === '') {
        return '暂无';
    }
    return String(value);
}

function DetailSection({
    title,
    content,
    icon,
}: {
    title: string;
    content?: string;
    icon: ImageSourcePropType;
}) {
    return (
        <>
            <Flex style={{ marginTop: 10 }} align="center">
                <Image source={icon} style={styles.medicalImg} />
                <Text style={styles.medicalTitle}>{title}</Text>
            </Flex>
            <View style={styles.medicalBox}>
                <Text style={[styles.medicalInfoValue, { color: AppTheme.textSecondary }]}>{displayValue(content)}</Text>
            </View>
        </>
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
                onPress={() => openAttachment(att)}>
                <Image source={{ uri: att.ossUrl }} style={styles.attachmentImg} />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            key={`${att.ossId ?? att.ossUrl}-${index}`}
            activeOpacity={0.8}
            style={styles.attachmentFileItem}
            onPress={() => openAttachment(att)}>
            <Flex align="center">
                <MaterialIcons name="description" size={28} color={AppTheme.textSecondary} />
                <Text style={styles.attachmentFileName} numberOfLines={2}>
                    {displayName}
                </Text>
            </Flex>
        </TouchableOpacity>
    );
}

export default function CaseDetailPage({ route }: Props) {
    const { id } = route.params;
    const user = useSelector((state: RootState) => state.user.info);
    const systemUser = useSelector((state: RootState) => state.user.systemUser);
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

    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const name = getDisplayUserName(user, systemUser);
    const birthMoment = moment(user?.birthDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    const ageText = birthMoment.isValid() ? `${moment().diff(birthMoment, 'years')}岁` : '暂无';
    const gender = displayValue(user?.gender);
    const bloodType = displayValue(user?.bloodType);
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
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Flex direction="column" justify="center" align="center" style={{ marginTop: 19 }}>
                    <View>
                        {avatarOssUrl ? (
                            <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{name[0] ?? 'U'}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.userText}>
                        {gender}-{ageText}-{bloodType}
                    </Text>
                </Flex>

                <View style={styles.medicalBox}>
                    <Flex align="center">
                        <Image source={require('@/assets/images/user/hospital.png')} style={styles.medicalImg} />
                        <Text style={styles.medicalTitle}>{displayValue(record.diagnosticResult)}</Text>
                        <Flex style={styles.medicalType}>
                            <Text style={styles.medicalTypeText}>{displayValue(record.medicalRecordType)}</Text>
                        </Flex>
                    </Flex>
                    <View style={styles.medicalInfoBox}>
                        <Flex>
                            <View style={[styles.medicalCol, styles.medicalColLeft]}>
                                <Text style={styles.medicalInfoTitle}>医院</Text>
                                <Text style={styles.medicalInfoValue}>{displayValue(record.hospital)}</Text>
                            </View>
                            <View style={styles.medicalCol}>
                                <Text style={styles.medicalInfoTitle}>医生</Text>
                                <Text style={styles.medicalInfoValue}>{displayValue(record.doctor)}</Text>
                            </View>
                        </Flex>
                        <Flex style={styles.medicalLine}>
                            <View style={[styles.medicalCol, styles.medicalColLeft]}>
                                <Text style={styles.medicalInfoTitle}>时间</Text>
                                <Text style={styles.medicalInfoValue}>{displayValue(record.recordDate)}</Text>
                            </View>
                            <View style={styles.medicalCol}>
                                <Text style={styles.medicalInfoTitle}>科室</Text>
                                <Text style={styles.medicalInfoValue}>{displayValue(record.medicalDepartment)}</Text>
                            </View>
                        </Flex>
                    </View>
                </View>

                {TEXT_SECTIONS.map(section => (
                    <DetailSection
                        key={section.key}
                        title={section.title}
                        icon={section.icon}
                        content={record[section.key] as string | undefined}
                    />
                ))}

                <Flex style={{ marginTop: 10 }} align="center">
                    <Image source={require('@/assets/images/user/file.png')} style={styles.medicalImg} />
                    <Text style={styles.medicalTitle}>附件</Text>
                </Flex>
                <View style={styles.medicalBox}>
                    {hasAttachments ? (
                        <>
                            {imageAttachments.length > 0 ? (
                                <View style={styles.attachmentList}>
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
                                <View style={[styles.attachmentFileList, imageAttachments.length > 0 && styles.attachmentFileListGap]}>
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
                        <Text style={[styles.medicalInfoValue, { color: AppTheme.textSecondary }]}>暂无</Text>
                    )}
                </View>
            </ScrollView>
        </PageLayout>
    );
}

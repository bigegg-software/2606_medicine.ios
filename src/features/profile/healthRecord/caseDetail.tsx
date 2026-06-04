import React, { useEffect, useState } from 'react';
import { Text, Image, View, ScrollView, ActivityIndicator, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import moment from 'moment';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMedicalRecordInfo, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/caseAdd';
import { apiResourceData } from '@/src/utils/apiHelpers';
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

function DetailSection({
    title,
    content,
    icon,
}: {
    title: string;
    content?: string;
    icon: ImageSourcePropType;
}) {
    if (!content?.trim()) {
        return null;
    }
    return (
        <>
            <Flex style={{ marginTop: 10 }} align="center">
                <Image source={icon} style={styles.medicalImg} />
                <Text style={styles.medicalTitle}>{title}</Text>
            </Flex>
            <View style={styles.medicalBox}>
                <Text style={styles.medicalInfoValue}>{content}</Text>
            </View>
        </>
    );
}

function displayValue(value?: string | number) {
    if (value == null || value === '') {
        return '—';
    }
    return String(value);
}

export default function CaseDetailPage({ route }: Props) {
    const { id } = route.params;
    const user = useSelector((state: RootState) => state.user.info);
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getMedicalRecordInfo(id);
                console.log(res)
                setRecord(apiResourceData<MedicalRecord>(res as { code?: number; data?: MedicalRecord }) ?? null);
            } catch {
                setRecord(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const name = user?.name ?? '';
    const birthMoment = moment(user?.birthDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    const age = birthMoment.isValid() ? moment().diff(birthMoment, 'years') : '--';
    const gender = user?.gender ?? '—';
    const bloodType = user?.bloodType ?? '—';

    if (loading) {
        return (
            <SafeAreaView edges={['bottom']} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </SafeAreaView>
        );
    }

    if (!record) {
        return (
            <SafeAreaView edges={['bottom']} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: AppTheme.textSecondary }}>暂无病例详情</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
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
                        {gender}-{age}岁-{bloodType}
                    </Text>
                </Flex>

                <View style={styles.medicalBox}>
                    <Flex align="center">
                        <Image source={require('@/assets/images/user/hospital.png')} style={styles.medicalImg} />
                        <Text style={styles.medicalTitle}>{displayValue(record.diagnosticResult)}</Text>
                        {record.medicalRecordType ? (
                            <Flex style={styles.medicalType}>
                                <Text style={styles.medicalTypeText}>{record.medicalRecordType}</Text>
                            </Flex>
                        ) : null}
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

                {record.attachmentList && record.attachmentList.length > 0 ? (
                    <>
                        <Flex style={{ marginTop: 10 }} align="center">
                            <Image source={require('@/assets/images/user/file.png')} style={styles.medicalImg} />
                            <Text style={styles.medicalTitle}>附件</Text>
                        </Flex>
                        <View style={styles.medicalBox}>
                            <View style={styles.attachmentList}>
                                {record.attachmentList.map((att, index) =>
                                    att.ossUrl ? (
                                        <Image
                                            key={`${att.ossId ?? att.ossUrl}-${index}`}
                                            source={{ uri: att.ossUrl }}
                                            style={styles.attachmentImg}
                                        />
                                    ) : null,
                                )}
                            </View>
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

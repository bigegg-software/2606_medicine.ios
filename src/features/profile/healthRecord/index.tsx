import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllergyInfo, type AllergyItem } from '@/api/allergy';
import { getFamilyMedicalInfo, type FamilyMedicalItem } from '@/api/familyMedical';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import { getChronicDiseaseFrontList, type ChronicDiseaseRecord } from '@/api/chronicDisease';
import {
    getUserQuestionNewList,
    type QuestionnaireType,
    type UserQuestionNewListResult,
    type UserQuestionRecord,
} from '@/api/questionTemplate';
import type { EmergencyContact } from '@/api/emergencyContact';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import questionnaireStyles from '@/css/questionnaire/index';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';
import { getDisplayUserName, getDefaultAvatarByGender, maskPhoneNumber } from '@/src/utils/userHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/route/router';
import {
    formatEmergencyContactName,
    loadEmergencyContacts,
    loadRelationTypeLabelMap,
} from '@/src/features/profile/emergencyHelpers';
import ChronicDiseaseCard from '@/src/features/profile/chronicDisease/components/ChronicDiseaseCard';
import {
    DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS,
    loadChronicIndexIndicators,
    loadDiseaseTypeLabelMap,
    type ChronicDiseaseDailyIndicators,
} from '@/src/features/profile/chronicDisease/components/chronicData';
import {
    buildLastAssessmentMap,
    canStartAssessment,
    getAssessmentStatusIcon,
    getNextAssessmentDate,
    QUESTIONNAIRE_CONFIG,
    QUESTIONNAIRE_TITLES,
    type AssessmentSummary,
} from '@/src/features/profile/questionnaire/utils/helpers';
import { formatMemberTitle, getStatusStyles } from './utils/familyHistoryHelpers';
import familyHistoryStyles from '@/css/profile/familyHistory';
import moment from 'moment';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CHRONIC_PREVIEW_SIZE = 2;

function formatRecordTitle(record: MedicalRecord) {
    return record.hospital?.trim() || '—';
}

function formatRecordDateLabel(record: MedicalRecord) {
    const { recordDate, medicalRecordType } = record;
    if (!recordDate) return '—';
    const dateMoment = moment(recordDate, ['YYYY-MM-DD', 'YYYYMMDD', 'YYYY/MM/DD'], true);
    const dateText = dateMoment.isValid() ? dateMoment.format('YYYY/MM/DD') : recordDate;
    return medicalRecordType ? `${dateText}·${medicalRecordType}` : dateText;
}

function recordIcon(type?: string) {
    return type === '住院'
        ? require('@/assets/images/user/hospital1.png')
        : require('@/assets/images/user/hospital.png');
}

const ALLERGY_SECTIONS = [
    { type: '药物过敏', title: '药物过敏', icon: require('@/assets/images/user/icon1.png') },
    { type: '食物过敏', title: '食物过敏', icon: require('@/assets/images/user/icon2.png') },
    { type: '其他', title: '其他过敏', icon: require('@/assets/images/user/icon3.png') },
] as const;

function getAllergySectionSummary(list: AllergyItem[], type: string) {
    const names = list
        .filter(item => item.allergyType === type)
        .map(item => item.allergenName)
        .filter(Boolean);
    return {
        text: names.length ? names.join('、') : '无',
        hasAllergy: names.length > 0,
    };
}

export default function HealthRecordPage() {
    const navigation = useNavigation<Nav>();
    const user = useSelector((state: RootState) => state.user.info);
    const systemUser = useSelector((state: RootState) => state.user.systemUser);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [allergyList, setAllergyList] = useState<AllergyItem[]>([]);
    const [familyList, setFamilyList] = useState<FamilyMedicalItem[]>([]);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [relationMap, setRelationMap] = useState<Record<string, string>>({});
    const [chronicRecords, setChronicRecords] = useState<ChronicDiseaseRecord[]>([]);
    const [diseaseTypeLabels, setDiseaseTypeLabels] = useState<Record<string, string>>({});
    const [dailyIndicatorsById, setDailyIndicatorsById] = useState<Map<number, ChronicDiseaseDailyIndicators>>(
        new Map(),
    );
    const [lastAssessmentByType, setLastAssessmentByType] = useState<
        Partial<Record<QuestionnaireType, AssessmentSummary>>
    >({});

    const loadRecords = useCallback(async () => {
        try {
            const res = await getMedicalRecordFrontList({ pageNum: 1, pageSize: 3 });
            setRecords(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
        } catch {
            setRecords([]);
        }
    }, []);

    const loadAllergies = useCallback(async () => {
        try {
            const res = await getAllergyInfo();
            const data = apiResourceData<{ allergyList?: AllergyItem[] }>(
                res as { code?: number; data?: { allergyList?: AllergyItem[] } },
            );
            setAllergyList(Array.isArray(data?.allergyList) ? data!.allergyList! : []);
        } catch {
            setAllergyList([]);
        }
    }, []);

    const loadFamilyMedical = useCallback(async () => {
        try {
            const res = await getFamilyMedicalInfo();
            const data = apiResourceData<{ familyMedicalList?: FamilyMedicalItem[] }>(
                res as { code?: number; data?: { familyMedicalList?: FamilyMedicalItem[] } },
            );
            setFamilyList(Array.isArray(data?.familyMedicalList) ? data!.familyMedicalList! : []);
        } catch {
            setFamilyList([]);
        }
    }, []);

    const loadEmergency = useCallback(async () => {
        try {
            const [list, labels] = await Promise.all([
                loadEmergencyContacts({ pageNum: 1, pageSize: 3 }),
                loadRelationTypeLabelMap(),
            ]);
            setEmergencyContacts(list);
            setRelationMap(labels);
        } catch {
            setEmergencyContacts([]);
            setRelationMap({});
        }
    }, []);

    const loadChronicDiseases = useCallback(async () => {
        try {
            const [res, labelMap] = await Promise.all([
                getChronicDiseaseFrontList({ pageNum: 1, pageSize: CHRONIC_PREVIEW_SIZE }),
                loadDiseaseTypeLabelMap(),
            ]);
            const rows = getResourceRows(res as { code?: number; rows?: ChronicDiseaseRecord[] })
                .slice(0, CHRONIC_PREVIEW_SIZE);
            setDiseaseTypeLabels(labelMap);
            setChronicRecords(rows);
            const indicators = await loadChronicIndexIndicators(rows, labelMap);
            setDailyIndicatorsById(indicators);
        } catch {
            setChronicRecords([]);
            setDiseaseTypeLabels({});
            setDailyIndicatorsById(new Map());
        }
    }, []);

    const loadQuestionnaires = useCallback(async () => {
        try {
            const latestRes = await getUserQuestionNewList();
            const latestRecords =
                apiResourceData<UserQuestionRecord[]>(latestRes as unknown as UserQuestionNewListResult) ?? [];
            setLastAssessmentByType(buildLastAssessmentMap(latestRecords));
        } catch {
            setLastAssessmentByType({});
        }
    }, []);

    const loadRecordsRef = useRef(loadRecords);
    loadRecordsRef.current = loadRecords;
    const loadAllergiesRef = useRef(loadAllergies);
    loadAllergiesRef.current = loadAllergies;
    const loadFamilyMedicalRef = useRef(loadFamilyMedical);
    loadFamilyMedicalRef.current = loadFamilyMedical;
    const loadEmergencyRef = useRef(loadEmergency);
    loadEmergencyRef.current = loadEmergency;
    const loadChronicDiseasesRef = useRef(loadChronicDiseases);
    loadChronicDiseasesRef.current = loadChronicDiseases;
    const loadQuestionnairesRef = useRef(loadQuestionnaires);
    loadQuestionnairesRef.current = loadQuestionnaires;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRecordsRef.current();
        loadAllergiesRef.current();
        loadFamilyMedicalRef.current();
        loadEmergencyRef.current();
        loadChronicDiseasesRef.current();
        loadQuestionnairesRef.current();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadRecordsRef.current();
            loadAllergiesRef.current();
            loadFamilyMedicalRef.current();
            loadEmergencyRef.current();
            loadChronicDiseasesRef.current();
            loadQuestionnairesRef.current();
        }, []),
    );


    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const defaultAvatar = getDefaultAvatarByGender(user?.gender);
    const name = getDisplayUserName(user);

    const birthMoment = moment(user?.birthDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    const birthDate = birthMoment.isValid() ? birthMoment.format('YYYY-MM-DD') : '--';
    const age = birthMoment.isValid() ? moment().diff(birthMoment, 'years') : '--';
    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body}>

                <View style={styles.userBox}>
                    <Flex direction="column" justify='center' align='center' style={styles.userInfoBox}>
                        {avatarOssUrl ? (
                            <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
                        ) : (
                            <Image source={defaultAvatar} style={styles.avatarImg} />
                        )}
                        <TouchableOpacity onPress={() => navigation.navigate('ProfileEditPage')}>
                            <Image style={styles.userEditIcon} source={require('@/assets/images/user/userEdit.png')} />
                        </TouchableOpacity>
                    </Flex>

                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>姓名</Text>
                        <Text style={styles.infoItemValue}>{name}</Text>
                    </Flex>

                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>性别</Text>
                        <Text style={styles.infoItemValue}>{user?.gender || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>出生日期</Text>
                        <Text style={styles.infoItemValue}>{birthDate}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>年龄</Text>
                        <Text style={styles.infoItemValue}>{age}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>身高</Text>
                        <Text style={styles.infoItemValue}>{user?.height || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>体重</Text>
                        <Text style={styles.infoItemValue}>{user?.weight || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>血型</Text>
                        <Text style={styles.infoItemValue}>{user?.bloodType || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                        <Text style={styles.infoItemLabel}>手机号</Text>
                        <Text style={styles.infoItemValue}>{maskPhoneNumber(systemUser?.phonenumber)}</Text>
                    </Flex>
                </View>

                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>紧急联系人</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
                            <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                        </TouchableOpacity>
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {emergencyContacts.length === 0 ? (
                            <TouchableOpacity onPress={() => navigation.navigate('EmergencyAdd')}>
                                <Flex justify="between" style={styles.familyItem}>
                                    <Flex>
                                        <View style={styles.familyItemImgBox}>
                                            <Image style={styles.familyItemImg} source={require('@/assets/images/user/icon_phone.png')} />
                                        </View>
                                        <View>
                                            <Text style={styles.familyItemName}>点击添加联系人</Text>
                                            <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                                        </View>
                                    </Flex>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ) : (
                            emergencyContacts.map((contact, index) => (
                                <TouchableOpacity
                                    key={String(contact.id ?? index)}
                                    onPress={() => {
                                        if (contact.id != null) {
                                            navigation.navigate('EmergencyAdd', { id: contact.id });
                                        } else {
                                            navigation.navigate('Emergency');
                                        }
                                    }}>
                                    <Flex
                                        justify="between"
                                        style={styles.familyItem}>
                                        <Flex>
                                            <View style={styles.familyItemImgBox}>
                                                <Image style={styles.familyItemImg} source={require('@/assets/images/user/icon_phone.png')} />
                                            </View>
                                            <View>
                                                <Flex align="center">
                                                    <Text style={styles.familyItemName}>
                                                        {formatEmergencyContactName(contact, relationMap)}
                                                    </Text>
                                                    {contact.isDefault === 1 ? (
                                                        <Flex style={styles.jzBox}>
                                                            <Text style={styles.jzText}>默认</Text>
                                                        </Flex>
                                                    ) : null}
                                                </Flex>
                                                <Text style={styles.familyItemRelation}>
                                                    {contact.contactPhone || '—'}
                                                </Text>
                                            </View>
                                        </Flex>
                                        <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                    </Flex>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>病例记录</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('CaseNotes')}>
                            <Flex>
                                <Text style={styles.more}>全部</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {records.map((item, index) => (
                            <TouchableOpacity key={String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`)} onPress={() => navigation.navigate('CaseDetail', { id: item.medicalRecordId || 0 })}>
                                <Flex
                                    key={String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`)}
                                    justify="between"
                                    align="center"
                                    style={[styles.familyItem, index == records.length - 1 && { borderBottomWidth: 0 }]}>
                                    <Flex style={{ flex: 1, minWidth: 0, marginRight: 8 }} align="center">
                                        <View style={styles.familyItemImgBox}>
                                            <Image style={styles.familyItemImg} source={require('@/assets/images/user/icon_order.png')} />
                                        </View>
                                        <View style={styles.familyItemContent}>
                                            <Text style={styles.familyItemName} numberOfLines={1} ellipsizeMode="tail">
                                                {formatRecordTitle(item)}
                                            </Text>
                                            <Text style={styles.familyItemRelation} numberOfLines={1} ellipsizeMode="tail">
                                                {item.doctor?.trim() || '—'}
                                            </Text>
                                        </View>
                                    </Flex>
                                    <Text style={styles.familyItemTime}>{formatRecordDateLabel(item)}</Text>
                                </Flex>
                            </TouchableOpacity>
                        ))}
                        {records.length === 0 ? (
                            <TouchableOpacity onPress={() => navigation.navigate('CaseAdd')}>
                                <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                                    <Flex>
                                        <View style={styles.familyItemImgBox}>
                                            <Image style={styles.familyItemImg} source={require('@/assets/images/user/icon_order.png')} />
                                        </View>
                                        <Text style={styles.familyItemName}>点击添加病例</Text>
                                    </Flex>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                </View>
                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>过敏史</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Allergies')}>
                            <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                        </TouchableOpacity>
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {ALLERGY_SECTIONS.map((section, index) => {
                            const allergySummary = getAllergySectionSummary(allergyList, section.type);
                            return (
                                <Flex
                                    key={section.type}
                                    justify="between"
                                    align="center"
                                    style={[styles.familyItem,
                                    index === ALLERGY_SECTIONS.length - 1 && { borderBottomWidth: 0 },
                                    ]}>
                                    <Flex style={styles.allergyItemLeft}>
                                        <Image style={[styles.imgItem, { marginRight: 15 }]} source={section.icon} />
                                        <Text style={styles.familyItemName}>{section.title}</Text>
                                    </Flex>
                                    <Text
                                        style={[
                                            styles.infoItemValue,
                                            styles.allergySummaryText,
                                            allergySummary.hasAllergy && styles.allergySummaryActive,
                                        ]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {allergySummary.text}
                                    </Text>
                                </Flex>
                            );
                        })}
                    </View>
                </View>
                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>家族病史</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('FamilyHistory')}>
                            <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                        </TouchableOpacity>
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {familyList.length === 0 ? (
                            <TouchableOpacity onPress={() => navigation.navigate('FamilyHistoryAdd')}>
                                <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                                    <View>
                                        <Text style={styles.familyItemName}>点击添加家族病史</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('FamilyHistory')}>
                                <View style={familyHistoryStyles.listBox}>
                                    {familyList.map((item, index) => {
                                        const statusStyle = getStatusStyles(item.status);
                                        return (
                                            <Flex
                                                key={`${index}-${item.familyRelationships}`}
                                                align="center"
                                                style={familyHistoryStyles.infoBox}>
                                                <View style={familyHistoryStyles.itemImgBox}>
                                                    <Image
                                                        style={familyHistoryStyles.itemImg}
                                                        source={require('@/assets/images/user/icon_user.png')}
                                                    />
                                                </View>
                                                <View style={familyHistoryStyles.itemContent}>
                                                    <Flex align="center">
                                                        <Text
                                                            style={familyHistoryStyles.itemName}
                                                            numberOfLines={1}
                                                            ellipsizeMode="tail">
                                                            {formatMemberTitle(item)}
                                                        </Text>
                                                        {item.status ? (
                                                            <View style={statusStyle.box}>
                                                                <Text style={statusStyle.text}>{item.status}</Text>
                                                            </View>
                                                        ) : null}
                                                    </Flex>
                                                    <Text style={familyHistoryStyles.itemSubtitle} numberOfLines={1}>
                                                        {item.medicalCondition || '—'}
                                                    </Text>
                                                </View>
                                            </Flex>
                                        );
                                    })}
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>慢病管理</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ChronicDisease')}>
                            <Flex>
                                <Text style={styles.more}>全部</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>
                    {chronicRecords.length > 0 ? (
                        chronicRecords.map(item => {
                            const dailyIndicators =
                                item.id != null
                                    ? dailyIndicatorsById.get(item.id) ?? DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS
                                    : DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS;
                            return (
                                <ChronicDiseaseCard
                                    key={String(item.id)}
                                    record={item}
                                    diseaseTypeLabels={diseaseTypeLabels}
                                    dailyIndicators={dailyIndicators}
                                    onPress={() =>
                                        item.id != null
                                        && navigation.navigate('ChronicDiseaseDetailPage', { id: item.id })
                                    }
                                />
                            );
                        })
                    ) : (
                        <TouchableOpacity onPress={() => navigation.navigate('ChronicDiseaseAddPage')}>
                            <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0, marginTop: 10 }]}>
                                <Text style={styles.familyItemName}>点击添加慢病</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>评估问卷</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('QuestionnaireList')}>
                            <Flex>
                                <Text style={styles.more}>全部</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>

                    {QUESTIONNAIRE_CONFIG.map(item => {
                        const lastAssessment = lastAssessmentByType[item.type];
                        const hasLastAssessment = Boolean(lastAssessment?.date || lastAssessment?.result);
                        const canStart = canStartAssessment(item.type, lastAssessment?.date);
                        const nextAssessmentDate = getNextAssessmentDate(item.type, lastAssessment?.date);
                        const actionLabel = hasLastAssessment ? '重新评估' : '开始评估';

                        return (
                            <View key={item.type} style={questionnaireStyles.rowBox}>
                                <Flex justify="between" align="center">
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={questionnaireStyles.rowTitle}>
                                            {QUESTIONNAIRE_TITLES[item.type]}
                                        </Text>
                                        <Text style={questionnaireStyles.rowText}>预计时间：{item.duration}</Text>
                                    </View>
                                    {hasLastAssessment ? (
                                        <Image
                                            style={questionnaireStyles.timeIcon}
                                            source={require('@/assets/images/questionnaire/time.png')}
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            style={questionnaireStyles.startBtn}
                                            onPress={() =>
                                                navigation.navigate('QuestionnairePage', { type: item.type })
                                            }>
                                            <Flex style={{ flex: 1 }} justify="center">
                                                <Text style={questionnaireStyles.startText}>{actionLabel}</Text>
                                            </Flex>
                                        </TouchableOpacity>
                                    )}
                                </Flex>
                                {hasLastAssessment ? (
                                    <>
                                        <View style={[questionnaireStyles.rowLine, { marginTop: 12 }]} />
                                        <Flex justify="between" align="center" style={questionnaireStyles.btmBox}>
                                            <Flex style={{ flex: 1, marginRight: 8 }}>
                                                <Image
                                                    style={questionnaireStyles.iconSize}
                                                    source={getAssessmentStatusIcon(lastAssessment?.statusStyle)}
                                                />
                                                <View style={{ marginLeft: 6, flexShrink: 1 }}>
                                                    {lastAssessment?.result ? (
                                                        <Text style={questionnaireStyles.rowTitleText}>
                                                            {lastAssessment.result}
                                                        </Text>
                                                    ) : null}
                                                    {lastAssessment?.date ? (
                                                        <Text style={questionnaireStyles.rowText}>
                                                            上次评估：{lastAssessment.date}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </Flex>
                                            <TouchableOpacity
                                                style={[
                                                    questionnaireStyles.startBtn,
                                                    !canStart && questionnaireStyles.startBtnDisabled,
                                                ]}
                                                disabled={!canStart}
                                                onPress={() =>
                                                    navigation.navigate('QuestionnairePage', { type: item.type })
                                                }>
                                                <Flex style={{ flex: 1 }} justify="center">
                                                    <Text
                                                        style={[
                                                            questionnaireStyles.startText,
                                                            !canStart && questionnaireStyles.startTextDisabled,
                                                        ]}>
                                                        {actionLabel}
                                                    </Text>
                                                </Flex>
                                            </TouchableOpacity>
                                        </Flex>
                                    </>
                                ) : null}
                                {!canStart && nextAssessmentDate ? (
                                    <Flex style={questionnaireStyles.nextAssessBox} align="center">
                                        <Image
                                            style={questionnaireStyles.nextAssessIcon}
                                            source={require('@/assets/images/questionnaire/icon_ts.png')}
                                        />
                                        <Text style={questionnaireStyles.nextAssessLabel}>下次评估时间：</Text>
                                        <Text style={questionnaireStyles.nextAssessDate}>{nextAssessmentDate}</Text>
                                    </Flex>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </PageLayout>
    );
}

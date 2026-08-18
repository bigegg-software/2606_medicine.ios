import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
import type { UserBaseInfo } from '@/api/patient';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import questionnaireStyles from '@/css/questionnaire/index';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchFamilyBindMyList } from '@/store/actions/family';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';
import { getDisplayUserName, getDefaultAvatarByGender, maskPhoneNumber } from '@/src/utils/userHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/route/router';
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import {
    formatEmergencyContactName,
    loadEmergencyContacts,
    loadRelationTypeLabelMap,
} from '@/src/features/profile/emergencyHelpers';
import { resolveDailyActivityLevelLabel } from '@/src/features/profile/healthRecord/utils/profileActivityLevelHelpers';
import {
    loadHealthRecordFamilyUser,
    resolveHealthRecordFamilyPhone,
    resolveHealthRecordPatientOpts,
} from '@/src/features/profile/healthRecord/utils/healthRecordFamilyHelpers';
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
type Route = RouteProp<RootStackParamList, 'HealthRecord'>;

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
    const route = useRoute<Route>();
    const dispatch = useDispatch<AppDispatch>();
    const { readOnly, patientUserId, relationLabel, displayName, viewNavParams } = resolveFamilyReadOnlyView(route.params);
    const patientOpts = useMemo(
        () => resolveHealthRecordPatientOpts(patientUserId),
        [patientUserId],
    );
    const user = useSelector((state: RootState) => state.user.info);
    const systemUser = useSelector((state: RootState) => state.user.systemUser);
    const familyBindList = useSelector((state: RootState) => state.family.list);
    const [familyUser, setFamilyUser] = useState<UserBaseInfo | null>(null);
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
            const res = await getMedicalRecordFrontList({ pageNum: 1, pageSize: 3 }, patientOpts);
            setRecords(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
        } catch {
            setRecords([]);
        }
    }, [patientOpts]);

    const loadAllergies = useCallback(async () => {
        try {
            const res = await getAllergyInfo(patientOpts);
            const data = apiResourceData<{ allergyList?: AllergyItem[] }>(
                res as { code?: number; data?: { allergyList?: AllergyItem[] } },
            );
            setAllergyList(Array.isArray(data?.allergyList) ? data!.allergyList! : []);
        } catch {
            setAllergyList([]);
        }
    }, [patientOpts]);

    const loadFamilyMedical = useCallback(async () => {
        try {
            const res = await getFamilyMedicalInfo(patientOpts);
            const data = apiResourceData<{ familyMedicalList?: FamilyMedicalItem[] }>(
                res as { code?: number; data?: { familyMedicalList?: FamilyMedicalItem[] } },
            );
            setFamilyList(Array.isArray(data?.familyMedicalList) ? data!.familyMedicalList! : []);
        } catch {
            setFamilyList([]);
        }
    }, [patientOpts]);

    const loadEmergency = useCallback(async () => {
        try {
            const [list, labels] = await Promise.all([
                loadEmergencyContacts({ pageNum: 1, pageSize: 3 }, patientOpts),
                loadRelationTypeLabelMap(),
            ]);
            setEmergencyContacts(list);
            setRelationMap(labels);
        } catch {
            setEmergencyContacts([]);
            setRelationMap({});
        }
    }, [patientOpts]);

    const loadChronicDiseases = useCallback(async () => {
        try {
            const [res, labelMap] = await Promise.all([
                getChronicDiseaseFrontList({ pageNum: 1, pageSize: CHRONIC_PREVIEW_SIZE }, patientOpts),
                loadDiseaseTypeLabelMap(),
            ]);
            const rows = getResourceRows(res as { code?: number; rows?: ChronicDiseaseRecord[] })
                .slice(0, CHRONIC_PREVIEW_SIZE);
            setDiseaseTypeLabels(labelMap);
            setChronicRecords(rows);
            const indicators = await loadChronicIndexIndicators(rows, labelMap, patientOpts);
            setDailyIndicatorsById(indicators);
        } catch {
            setChronicRecords([]);
            setDiseaseTypeLabels({});
            setDailyIndicatorsById(new Map());
        }
    }, [patientOpts]);

    const loadQuestionnaires = useCallback(async () => {
        try {
            const latestRes = await getUserQuestionNewList(patientOpts);
            const latestRecords =
                apiResourceData<UserQuestionRecord[]>(latestRes as unknown as UserQuestionNewListResult) ?? [];
            setLastAssessmentByType(buildLastAssessmentMap(latestRecords));
        } catch {
            setLastAssessmentByType({});
        }
    }, [patientOpts]);

    const loadFamilyProfile = useCallback(async () => {
        if (!readOnly) {
            setFamilyUser(null);
            return;
        }
        const info = await loadHealthRecordFamilyUser(patientUserId);
        setFamilyUser(info);
    }, [patientUserId, readOnly]);

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
    const loadFamilyProfileRef = useRef(loadFamilyProfile);
    loadFamilyProfileRef.current = loadFamilyProfile;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (readOnly) {
            void dispatch(fetchFamilyBindMyList());
        }
    }, [dispatch, readOnly]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: readOnly
                ? () => <FamilyRelationHeaderBadge label={relationLabel} />
                : undefined,
        });
    }, [navigation, readOnly, relationLabel]);

    useEffect(() => {
        loadFamilyProfileRef.current();
        loadRecordsRef.current();
        loadAllergiesRef.current();
        loadFamilyMedicalRef.current();
        loadEmergencyRef.current();
        loadChronicDiseasesRef.current();
        loadQuestionnairesRef.current();
    }, [patientUserId]);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadFamilyProfileRef.current();
            loadRecordsRef.current();
            loadAllergiesRef.current();
            loadFamilyMedicalRef.current();
            loadEmergencyRef.current();
            loadChronicDiseasesRef.current();
            loadQuestionnairesRef.current();
        }, []),
    );

    const profileUser = readOnly ? familyUser : user;
    const avatarOssUrl = String(profileUser?.avatarOssUrl ?? '');
    const defaultAvatar = getDefaultAvatarByGender(profileUser?.gender);
    const name = readOnly
        ? (familyUser?.name?.trim() || displayName || '--')
        : getDisplayUserName(user);
    const phoneText = readOnly
        ? maskPhoneNumber(resolveHealthRecordFamilyPhone(familyBindList, patientUserId))
        : maskPhoneNumber(systemUser?.phonenumber);

    const birthMoment = moment(profileUser?.birthDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
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
                        {!readOnly ? (
                            <TouchableOpacity onPress={() => navigation.navigate('ProfileEditPage')}>
                                <Image style={styles.userEditIcon} source={require('@/assets/images/user/userEdit.png')} />
                            </TouchableOpacity>
                        ) : null}
                    </Flex>

                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>姓名</Text>
                        <Text style={styles.infoItemValue}>{name}</Text>
                    </Flex>

                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>性别</Text>
                        <Text style={styles.infoItemValue}>{profileUser?.gender || '--'}</Text>
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
                        <Text style={styles.infoItemValue}>{profileUser?.height || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>体重</Text>
                        <Text style={styles.infoItemValue}>{profileUser?.weight || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>血型</Text>
                        <Text style={styles.infoItemValue}>{profileUser?.bloodType || '--'}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>活动水平</Text>
                        <Text style={styles.infoItemValue}>
                            {resolveDailyActivityLevelLabel(profileUser?.dailyActivityLevel) || '--'}
                        </Text>
                    </Flex>
                    <Flex justify="between" style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                        <Text style={styles.infoItemLabel}>手机号</Text>
                        <Text style={styles.infoItemValue}>{phoneText}</Text>
                    </Flex>
                </View>

                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>紧急联系人</Text>
                        {readOnly ? (
                            <TouchableOpacity onPress={() => navigation.navigate('Emergency', viewNavParams)}>
                                <Flex>
                                    <Text style={styles.more}>全部</Text>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
                                <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                            </TouchableOpacity>
                        )}
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {emergencyContacts.length === 0 ? (
                            readOnly ? (
                                <Flex justify="between" style={styles.familyItem}>
                                    <Flex>
                                        <View style={styles.familyItemImgBox}>
                                            <Image style={styles.familyItemImg} source={require('@/assets/images/user/icon_phone.png')} />
                                        </View>
                                        <View>
                                            <Text style={styles.familyItemName}>暂未添加联系人</Text>
                                        </View>
                                    </Flex>
                                </Flex>
                            ) : (
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
                            )
                        ) : (
                            emergencyContacts.map((contact, index) => {
                                const row = (
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
                                );
                                return (
                                    <TouchableOpacity
                                        key={String(contact.id ?? index)}
                                        activeOpacity={readOnly ? 0.85 : 0.7}
                                        onPress={() => {
                                            if (readOnly) {
                                                navigation.navigate('Emergency', viewNavParams);
                                                return;
                                            }
                                            if (contact.id != null) {
                                                navigation.navigate('EmergencyAdd', { id: contact.id });
                                            } else {
                                                navigation.navigate('Emergency');
                                            }
                                        }}>
                                        {row}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>病例记录</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CaseNotes', viewNavParams)}>
                            <Flex>
                                <Text style={styles.more}>全部</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {records.map((item, index) => {
                            const row = (
                                <Flex
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
                            );
                            const key = String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`);
                            return (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() =>
                                        navigation.navigate('CaseDetail', {
                                            id: item.medicalRecordId || 0,
                                            ...(viewNavParams ?? {}),
                                        })
                                    }>
                                    {row}
                                </TouchableOpacity>
                            );
                        })}
                        {records.length === 0 ? (
                            readOnly ? (
                                <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                                    <Flex>
                                        <View style={styles.familyItemImgBox}>
                                            <Image style={styles.familyItemImg} source={require('@/assets/images/user/icon_order.png')} />
                                        </View>
                                        <Text style={styles.familyItemName}>暂无病例记录</Text>
                                    </Flex>
                                </Flex>
                            ) : (
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
                            )
                        ) : null}
                    </View>

                </View>
                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>过敏史</Text>
                        {readOnly ? (
                            <TouchableOpacity onPress={() => navigation.navigate('Allergies', viewNavParams)}>
                                <Flex>
                                    <Text style={styles.more}>全部</Text>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => navigation.navigate('Allergies')}>
                                <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                            </TouchableOpacity>
                        )}
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
                        {readOnly ? (
                            <TouchableOpacity onPress={() => navigation.navigate('FamilyHistory', viewNavParams)}>
                                <Flex>
                                    <Text style={styles.more}>全部</Text>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => navigation.navigate('FamilyHistory')}>
                                <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                            </TouchableOpacity>
                        )}
                    </Flex>

                    <View style={{ marginTop: 10 }}>
                        {familyList.length === 0 ? (
                            readOnly ? (
                                <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                                    <View>
                                        <Text style={styles.familyItemName}>暂无家族病史</Text>
                                    </View>
                                </Flex>
                            ) : (
                                <TouchableOpacity onPress={() => navigation.navigate('FamilyHistoryAdd')}>
                                    <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                                        <View>
                                            <Text style={styles.familyItemName}>点击添加家族病史</Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                    </Flex>
                                </TouchableOpacity>
                            )
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('FamilyHistory', viewNavParams)}>
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
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ChronicDisease', viewNavParams)}>
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
                                        && navigation.navigate('ChronicDiseaseDetailPage', {
                                            id: item.id,
                                            ...(viewNavParams ?? {}),
                                        })
                                    }
                                />
                            );
                        })
                    ) : readOnly ? (
                        <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0, marginTop: 10 }]}>
                            <Text style={styles.familyItemName}>暂无慢病记录</Text>
                        </Flex>
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
                        <TouchableOpacity
                            onPress={() => navigation.navigate('QuestionnaireList', viewNavParams)}>
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
                                    ) : readOnly ? null : (
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
                                            <TouchableOpacity
                                                style={{ flex: 1, marginRight: 8 }}
                                                activeOpacity={lastAssessment?.id ? 0.85 : 1}
                                                disabled={!lastAssessment?.id}
                                                onPress={() => {
                                                    if (!lastAssessment?.id) return;
                                                    navigation.navigate('QuestionnaireDetail', {
                                                        id: lastAssessment.id,
                                                        ...(viewNavParams ?? {}),
                                                    });
                                                }}>
                                                <Flex>
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
                                            </TouchableOpacity>
                                            {!readOnly ? (
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
                                            ) : lastAssessment?.id ? (
                                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                            ) : null}
                                        </Flex>
                                    </>
                                ) : null}
                                {!readOnly && !canStart && nextAssessmentDate ? (
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

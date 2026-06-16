import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllergyInfo, type AllergyItem } from '@/api/allergy';
import { getFamilyMedicalInfo, type FamilyMedicalItem } from '@/api/familyMedical';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import { buildDictLabelMap } from '@/api/dict';
import type { EmergencyContact } from '@/api/emergencyContact';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';
import { getDisplayUserName, maskPhoneNumber } from '@/src/utils/userHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/route/router';
import {
  formatEmergencyContactName,
  loadEmergencyContacts,
  loadRelationTypeOptions,
} from '@/src/features/profile/emergencyHelpers';
import moment from 'moment';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatRecordTitle(record: MedicalRecord) {
    const diagnosis = record.diagnosticResult || '未填写诊断';
    const type = record.medicalRecordType;
    return type ? `${diagnosis}（${type}）` : diagnosis;
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

function formatAllergySummary(list: AllergyItem[], type: string) {
    const names = list
        .filter(item => item.allergyType === type)
        .map(item => item.allergenName)
        .filter(Boolean);
    return names.length ? names.join('、') : '无';
}

function formatFamilyPreviewLabel(item: FamilyMedicalItem) {
    const relation = item.familyRelationships || '—';
    const status = item.status ? `（${item.status}）` : '';
    return `${relation}${status}`;
}

function formatFamilyPreviewValue(item: FamilyMedicalItem) {
    if (!item.medicalCondition) {
        return '—';
    }
    return item.medicalCondition.replace(/,/g, '、');
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
            const [list, relationOptions] = await Promise.all([
                loadEmergencyContacts({ pageNum: 1, pageSize: 3 }),
                loadRelationTypeOptions(),
            ]);
            setEmergencyContacts(list);
            setRelationMap(buildDictLabelMap(relationOptions));
        } catch {
            setEmergencyContacts([]);
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

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRecordsRef.current();
        loadAllergiesRef.current();
        loadFamilyMedicalRef.current();
        loadEmergencyRef.current();
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
        }, []),
    );


    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const name = getDisplayUserName(user);

    const birthMoment = moment(user?.birthDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    const birthDate = birthMoment.isValid() ? birthMoment.format('YYYY-MM-DD') : '--';
    const age = birthMoment.isValid() ? moment().diff(birthMoment, 'years') : '--';
    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body}>
                <Flex direction="column" justify='center' align='center' style={{ marginTop: 16 }}>
                    {avatarOssUrl ? (
                        <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{name[0] ?? 'U'}</Text>
                        </View>
                    )}
                    <Text style={styles.name}>{name}</Text>
                </Flex>

                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>个人信息</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ProfileEditPage')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>

                <View style={styles.infoBox}>
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

                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>紧急联系人</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>

                <View style={styles.infoBox}>
                    {emergencyContacts.length === 0 ? (
                        <TouchableOpacity onPress={() => navigation.navigate('EmergencyAdd')}>
                            <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                                <View>
                                    <Text style={styles.familyItemName}>点击添加联系人</Text>
                                    <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    ) : (
                        emergencyContacts.map((contact, index) => (
                            <TouchableOpacity
                                key={String(contact.id ?? index)}
                                onPress={() => navigation.navigate('Emergency')}>
                                <Flex
                                    justify="between"
                                    style={[
                                        styles.familyItem,
                                        index === emergencyContacts.length - 1 && { borderBottomWidth: 0 },
                                    ]}>
                                    <View>
                                        <Text style={styles.familyItemName}>
                                            {formatEmergencyContactName(contact, relationMap)}
                                        </Text>
                                        <Text style={styles.familyItemRelation}>
                                            {contact.contactPhone || '—'}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                                </Flex>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>病例记录</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CaseNotes')}>
                        <Text style={styles.more}>查看全部</Text>
                    </TouchableOpacity>
                </Flex>

                <View style={styles.infoBox}>
                    {records.map((item, index) => (
                        <TouchableOpacity key={String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`)} onPress={() => navigation.navigate('CaseDetail', { id: item.medicalRecordId || 0 })}>
                            <Flex
                                key={String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`)}
                                justify="between"
                                style={[styles.familyItem, index == records.length - 1 && { borderBottomWidth: 0 }]}>
                                <Flex>
                                    <Flex justify="center" align="center" style={styles.imgBox}>
                                        <Image style={styles.imgItem} source={recordIcon(item.medicalRecordType)} />
                                    </Flex>
                                    <View style={styles.familyItemContent}>
                                        <Text style={styles.familyItemName} numberOfLines={1}>
                                            {formatRecordTitle(item)}
                                        </Text>
                                        <Text style={styles.familyItemRelation} numberOfLines={1}>
                                            {item.hospital || '—'}
                                        </Text>
                                    </View>
                                </Flex>
                                <Text style={styles.familyItemRelation}>{item.recordDate || '—'}</Text>
                            </Flex>
                        </TouchableOpacity>
                    ))}
                    {records.length == 0 && <TouchableOpacity onPress={() => navigation.navigate('CaseAdd')}>
                        <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <Flex>
                                <Flex justify="center" align="center" style={styles.imgBox}>
                                    <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                                </Flex>
                                <View style={styles.familyItemContent}>
                                    <Text style={styles.familyItemName}>点击添加病例</Text>
                                </View>
                            </Flex>
                            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                        </Flex>
                    </TouchableOpacity>}
                </View>
                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>过敏史</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Allergies')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>
                <View style={styles.infoBox}>
                    {ALLERGY_SECTIONS.map((section, index) => (
                        <Flex
                            key={section.type}
                            justify="between"
                            style={[
                                styles.familyItem,
                                index === ALLERGY_SECTIONS.length - 1 && { borderBottomWidth: 0 },
                            ]}>
                            <Flex>
                                <Image style={styles.imgItem} source={section.icon} />
                                <View style={styles.familyItemContent}>
                                    <Text style={styles.familyItemName}>{section.title}</Text>
                                </View>
                            </Flex>
                            <Text style={styles.infoItemValue} numberOfLines={1}>
                                {formatAllergySummary(allergyList, section.type)}
                            </Text>
                        </Flex>
                    ))}
                </View>
                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>家族病史</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('FamilyHistory')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>
                <View style={styles.infoBox}>
                    {familyList.length === 0 ? (
                        <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <Text style={styles.familyItemName}>暂无记录</Text>
                            <Text style={styles.infoItemValue}>—</Text>
                        </Flex>
                    ) : (
                        familyList.map((item, index) => (
                            <Flex
                                key={`${index}-${item.familyRelationships}`}
                                justify="between"
                                style={[
                                    styles.familyItem,
                                    index === familyList.length - 1 && { borderBottomWidth: 0 },
                                ]}>
                                <Text style={styles.familyItemName}>{formatFamilyPreviewLabel(item)}</Text>
                                <Text style={styles.infoItemValue} numberOfLines={1}>
                                    {formatFamilyPreviewValue(item)}
                                </Text>
                            </Flex>
                        ))
                    )}
                </View>
            </ScrollView>
        </PageLayout>
    );
}

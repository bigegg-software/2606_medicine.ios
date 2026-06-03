import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { getResourceRows } from '@/src/utils/apiHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/route/router';
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

export default function HealthRecordPage() {
    const navigation = useNavigation<Nav>();
    const user = useSelector((state: RootState) => state.user.info);
    const [records, setRecords] = useState<MedicalRecord[]>([]);

    const loadRecords = useCallback(async () => {
        try {
            const res = await getMedicalRecordFrontList({ pageNum: 1, pageSize: 3 });
            setRecords(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
        } catch {
            setRecords([]);
        }
    }, []);

    const loadRecordsRef = useRef(loadRecords);
    loadRecordsRef.current = loadRecords;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRecordsRef.current();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadRecordsRef.current();
        }, []),
    );


    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const name = user?.name ?? '';

    const birthMoment = moment(user?.birthDate, 'YYYYMMDD', true);
    const birthDate = birthMoment.isValid() ? birthMoment.format('YYYY-MM-DD') : '--';
    const age = birthMoment.isValid() ? moment().diff(birthMoment, 'years') : '--';
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
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
                    <TouchableOpacity>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>

                <View style={styles.infoBox}>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>性别</Text>
                        <Text style={styles.infoItemValue}>{user?.gender}</Text>
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
                        <Text style={styles.infoItemValue}>{user?.height}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>体重</Text>
                        <Text style={styles.infoItemValue}>{user?.weight}</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>血型</Text>
                        <Text style={styles.infoItemValue}>{user?.bloodType}</Text>
                    </Flex>
                    <Flex justify="between" style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                        <Text style={styles.infoItemLabel}>手机号</Text>
                        <Text style={styles.infoItemValue}>--</Text>
                    </Flex>
                </View>

                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>紧急联系人</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>

                <View style={styles.infoBox}>
                    {/* <Flex justify='between' style={styles.familyItem}>
                    <View>
                        <Text style={styles.familyItemName}>张小红（女儿）</Text>
                        <Text style={styles.familyItemRelation}>已授权4项权限</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                </Flex>
                <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                    <View>
                        <Text style={styles.familyItemName}>张小红（女儿）</Text>
                        <Text style={styles.familyItemRelation}>已授权4项权限</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                </Flex> */}
                    <TouchableOpacity onPress={() => { }}>
                        <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <View>
                                <Text style={styles.familyItemName}>点击添加联系人</Text>
                                <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                        </Flex>
                    </TouchableOpacity>
                </View>

                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>病例记录</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CaseNotes')}>
                        <Text style={styles.more}>查看全部</Text>
                    </TouchableOpacity>
                </Flex>

                <View style={styles.infoBox}>
                    {records.map((item, index) => (
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
                    <TouchableOpacity onPress={()=>navigation.navigate('Allergies')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>
                <View style={styles.infoBox}>
                    <Flex justify='between' style={styles.familyItem}>
                        <Flex>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/icon1.png')} />
                            <View style={styles.familyItemContent}>
                                <Text style={styles.familyItemName}>药物过敏</Text>
                            </View>
                        </Flex>
                        <Text style={styles.infoItemValue}>青霉素</Text>
                    </Flex>
                    <Flex justify='between' style={styles.familyItem}>
                        <Flex>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/icon2.png')} />
                            <View style={styles.familyItemContent}>
                                <Text style={styles.familyItemName}>食物过敏</Text>
                            </View>
                        </Flex>
                        <Text style={styles.infoItemValue}>无</Text>
                    </Flex>
                    <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                        <Flex>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/icon3.png')} />
                            <View style={styles.familyItemContent}>
                                <Text style={styles.familyItemName}>其他过敏</Text>
                            </View>
                        </Flex>
                        <Text style={styles.infoItemValue}>花粉</Text>
                    </Flex>
                </View>
                <Flex justify='between' style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>家族病史</Text>
                    <TouchableOpacity onPress={()=>navigation.navigate('FamilyHistory')}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                    </TouchableOpacity>
                </Flex>
                <View style={styles.infoBox}>
                    <Flex justify='between' style={styles.familyItem}>
                        <Text style={styles.familyItemName}>父亲（在世）</Text>
                        <Text style={styles.infoItemValue}>高血压、冠心病</Text>
                    </Flex>
                    <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                        <Text style={styles.familyItemName}>母亲（在世）</Text>
                        <Text style={styles.infoItemValue}>糖尿病</Text>
                    </Flex>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

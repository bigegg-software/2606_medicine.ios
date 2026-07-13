import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFamilyMedicalInfo, updateFamilyMedical, type FamilyMedicalItem, } from '@/api/familyMedical';
import { AppTheme } from '@/common/theme';
import layoutStyles from '@/css/profile/allergies';
import styles from '@/css/profile/healthRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatMemberTitle(item: FamilyMedicalItem) {
    const relation = item.familyRelationships || '—';
    const age = item.age != null ? String(item.age) : '—';
    if (item.status === '已故') {
        return `${relation}·享年${age}岁`;
    }
    return `${relation}·${age}岁`;
}

export default function FamilyHistoryPage() {
    const navigation = useNavigation<Nav>();
    const [familyList, setFamilyList] = useState<FamilyMedicalItem[]>([]);
    const [userId, setUserId] = useState<number | undefined>();
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await getFamilyMedicalInfo();
            const data = apiResourceData<{
                userId?: number;
                familyMedicalList?: FamilyMedicalItem[];
            }>(res as { code?: number; data?: { userId?: number; familyMedicalList?: FamilyMedicalItem[] } });
            setUserId(data?.userId);
            setFamilyList(Array.isArray(data?.familyMedicalList) ? data!.familyMedicalList! : []);
        } catch {
            setFamilyList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadRef = useRef(load);
    loadRef.current = load;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRef.current();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadRef.current();
        }, []),
    );

    const handleDelete = (index: number) => {
        Alert.alert('删除家族病史', '确定删除该记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    const next = familyList.filter((_, i) => i !== index);
                    try {
                        const res = await updateFamilyMedical({ userId, familyMedicalList: next });
                        if (isResourceApiOk(res as { code?: number })) {
                            setFamilyList(next);
                        } else {
                            const r = res as { msg?: string; message?: string };
                            Alert.alert('删除失败', r.msg ?? r.message ?? '请稍后重试');
                        }
                    } catch {
                        Alert.alert('错误', '网络错误，请稍后重试');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <PageLayout style={layoutStyles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={layoutStyles.container}>
            <ScrollView contentContainerStyle={layoutStyles.body}>
                <Flex style={layoutStyles.sectionBox}>
                    <Image style={layoutStyles.imgItem} source={require('@/assets/images/user/file.png')} />
                    <Text style={layoutStyles.sectionTitle}>已记录的家族病史</Text>
                </Flex>
                <View style={layoutStyles.listBox}>
                    {familyList.length === 0 ? (
                        <View style={layoutStyles.infoBox}>
                            <Text style={layoutStyles.mapItemSubtitle}>暂无记录</Text>
                        </View>
                    ) : (
                        familyList.map((item, index) => {
                            const isAlive = item.status === '在世';
                            return (
                                <Flex key={`${index}-${item.familyRelationships}`} justify="between" style={layoutStyles.infoBox}>
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        activeOpacity={0.7}
                                        onPress={() => navigation.navigate('FamilyHistoryAdd', { editIndex: index })}>
                                        <Flex>
                                            <Text style={layoutStyles.mapItemName}>{formatMemberTitle(item)}</Text>
                                            {item.status ? (
                                                <Flex style={isAlive ? layoutStyles.jzBox : layoutStyles.ygBox}>
                                                    <Text style={isAlive ? layoutStyles.jzText : layoutStyles.ygText}>{item.status}</Text>
                                                </Flex>
                                            ) : null}
                                        </Flex>
                                        <Text style={layoutStyles.mapItemSubtitle}>{item.medicalCondition || '—'}</Text>
                                    </TouchableOpacity>
                                    <Flex>
                                        <TouchableOpacity onPress={() => handleDelete(index)}>
                                            <Image style={layoutStyles.delIcon} source={require('@/assets/images/user/del.png')} />
                                        </TouchableOpacity>
                                    </Flex>
                                </Flex>
                            );
                        })
                    )}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('FamilyHistoryAdd')}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text style={styles.addText}>添加家族成员病史</Text>
                </Flex>
            </TouchableOpacity>
        </PageLayout>
    );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFamilyMedicalInfo, updateFamilyMedical, type FamilyMedicalItem } from '@/api/familyMedical';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/familyHistory';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { formatMemberTitle, getStatusStyles } from './utils/familyHistoryHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
            <PageLayout style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} edges={[]}>
            <ScrollView
                contentContainerStyle={
                    familyList.length === 0 ? styles.bodyEmpty : styles.body
                }>
                {familyList.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Image
                            style={styles.emptyImage}
                            source={require('@/assets/images/user/zwjl.png')}
                            resizeMode="contain"
                        />
                        <Text style={styles.emptyText}>暂无家族病史</Text>
                    </View>
                ) : (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>已记录的家族病史</Text>
                        <View style={styles.listBox}>
                            {familyList.map((item, index) => {
                                const statusStyle = getStatusStyles(item.status);
                                return (
                                    <Flex
                                        key={`${index}-${item.familyRelationships}`}
                                        justify="between"
                                        align="center"
                                        style={styles.infoBox}>
                                        <TouchableOpacity
                                            style={{ flex: 1 }}
                                            activeOpacity={0.7}
                                            onPress={() =>
                                                navigation.navigate('FamilyHistoryAdd', { editIndex: index })
                                            }>
                                            <Flex align="center">
                                                <View style={styles.itemImgBox}>
                                                    <Image
                                                        style={styles.itemImg}
                                                        source={require('@/assets/images/user/icon_user.png')}
                                                    />
                                                </View>
                                                <View style={styles.itemContent}>
                                                    <Flex align="center">
                                                        <Text
                                                            style={styles.itemName}
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
                                                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                                                        {item.medicalCondition || '—'}
                                                    </Text>
                                                </View>
                                            </Flex>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(index)}>
                                            <Image
                                                style={styles.delIcon}
                                                source={require('@/assets/images/case/icon_del.png')}
                                            />
                                        </TouchableOpacity>
                                    </Flex>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomBarButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('FamilyHistoryAdd')}>
                    <Flex style={{ flex: 1 }} justify="center" align="center">
                        <Image
                            style={styles.bottomBarButtonImg}
                            source={require('@/assets/images/vitals/icon_add.png')}
                        />
                        <Text style={styles.bottomBarButtonText}>添加家族成员病史</Text>
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}

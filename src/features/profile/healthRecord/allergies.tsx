import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllergyInfo, updateAllergy, type AllergyItem } from '@/api/allergy';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergies';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { getSeverityStyles } from './utils/allergiesHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ALLERGY_SECTIONS = [
    { type: '药物过敏', title: '药物过敏', icon: require('@/assets/images/user/icon1.png') },
    { type: '食物过敏', title: '食物过敏', icon: require('@/assets/images/user/icon2.png') },
    { type: '其他', title: '其他过敏', icon: require('@/assets/images/user/icon3.png') },
] as const;

export default function AllergiesPage() {
    const navigation = useNavigation<Nav>();
    const [allergyList, setAllergyList] = useState<AllergyItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await getAllergyInfo();
            const data = apiResourceData<{ allergyList?: AllergyItem[] }>(
                res as { code?: number; data?: { allergyList?: AllergyItem[] } },
            );
            setAllergyList(Array.isArray(data?.allergyList) ? data!.allergyList! : []);
        } catch {
            setAllergyList([]);
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
        Alert.alert('删除过敏史', '确定删除该过敏记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    const next = allergyList.filter((_, i) => i !== index);
                    try {
                        const res = await updateAllergy({ allergyList: next });
                        if (isResourceApiOk(res as { code?: number })) {
                            setAllergyList(next);
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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body}>
                {ALLERGY_SECTIONS.map(section => {
                    const items = allergyList
                        .map((item, index) => ({ item, index }))
                        .filter(({ item }) => item.allergyType === section.type);

                    return (
                        <View key={section.type} style={styles.sectionCard}>
                            <Flex justify="between" align="center" style={styles.sectionHeader}>
                                <Flex align="center">
                                    <Image style={styles.allergySectionIcon} source={section.icon} />
                                    <Text style={styles.allergySectionTitle}>{section.title}</Text>
                                </Flex>
                                <TouchableOpacity onPress={() => navigation.navigate('AllergiesAdd', { type: section.type })}>
                                    <Image style={styles.more} source={require('@/assets/images/case/icon_add.png')} />
                                </TouchableOpacity>
                            </Flex>
                            <View style={styles.allergyListBox}>
                                {items.length === 0 ? (
                                    <View style={styles.allergyInfoBox}>
                                        <Text style={[styles.allergyItemSubtitle, { marginTop: 0 }]}>待补充</Text>
                                    </View>
                                ) : (
                                    items.map(({ item, index }) => {
                                        const severityStyle = getSeverityStyles(item.severity);
                                        return (
                                            <Flex key={`${index}-${item.allergenName}`} justify="between" align="center" style={styles.allergyInfoBox}>
                                                <TouchableOpacity
                                                    style={{ flex: 1 }}
                                                    activeOpacity={0.7}
                                                    onPress={() =>
                                                        navigation.navigate('AllergiesAdd', {
                                                            type: section.type,
                                                            editIndex: index,
                                                        })
                                                    }>
                                                    <Flex align="center">
                                                        <Text style={styles.allergyItemName} numberOfLines={1} ellipsizeMode="tail">
                                                            {item.allergenName || '—'}
                                                        </Text>
                                                        {item.severity ? (
                                                            <View style={severityStyle.box}>
                                                                <Text style={severityStyle.text}>{item.severity}</Text>
                                                            </View>
                                                        ) : null}
                                                    </Flex>
                                                    <Text style={styles.allergyItemSubtitle}>
                                                        症状：{item.allergicSymptoms || '—'}
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(index)}>
                                                    <Image style={styles.delIcon} source={require('@/assets/images/case/icon_del.png')} />
                                                </TouchableOpacity>
                                            </Flex>
                                        );
                                    })
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </PageLayout>
    );
}

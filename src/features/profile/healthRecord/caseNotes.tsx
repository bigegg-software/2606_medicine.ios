import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { getMedicalRecordFrontList, removeMedicalRecord, type MedicalRecord } from '@/api/medicalRecord';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import SwipeDeleteRow, { closeActiveSwipeRow } from './components/SwipeDeleteRow';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const NAV_LIST = [
    { label: '全部', value: 'all', type: '' },
    { label: '住院', value: 'hospital', type: '住院' },
    { label: '门诊', value: 'outpatient', type: '门诊' },
] as const;

function CaseNoteCard({ item }: { item: MedicalRecord }) {
    const navigation = useNavigation<Nav>();
    return (
        <TouchableOpacity style={styles.caseBox} key={String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`)} onPress={() => navigation.navigate('CaseDetail', { id: item.medicalRecordId || 0 })}>
            <Flex justify="between" style={styles.caseTopBox}>
                <Text style={styles.caseTitle} numberOfLines={1}>
                    {item.diagnosticResult || '未填写诊断'}
                </Text>
                <Text style={styles.caseTime}>{item.recordDate || '—'}</Text>
            </Flex>
            <View style={styles.caseLine} />
            <View style={styles.caseContentBox}>
                <Flex justify="between">
                    <Text style={styles.caseContentText} numberOfLines={1}>
                        医院：{item.hospital || '—'}
                    </Text>
                    <Text style={styles.caseContentText} numberOfLines={1}>
                        科室：{item.medicalDepartment || '—'}
                    </Text>
                </Flex>
                <Flex justify="between">
                    <Text style={styles.caseContentText} numberOfLines={1}>
                        类型：{item.medicalRecordType || '—'}
                    </Text>
                    <Text style={styles.caseContentText} numberOfLines={1}>
                        主治医师：{item.doctor || '—'}
                    </Text>
                </Flex>
            </View>
        </TouchableOpacity>
    );
}

export default function CaseNotesPage() {
    const navigation = useNavigation<Nav>();
    const [activeNav, setActiveNav] = useState<(typeof NAV_LIST)[number]['value']>('all');
    const [keyword, setKeyword] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [items, setItems] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const nav = NAV_LIST.find(n => n.value === activeNav);
        try {
            const res = await getMedicalRecordFrontList({
                medicalRecordType: nav?.type || undefined,
                diagnosticResult: searchKeyword.trim() || undefined,
                pageNum: 1,
                pageSize: 50,
            });
            setItems(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeNav, searchKeyword]);

    const loadRef = useRef(load);
    loadRef.current = load;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRef.current();
    }, [activeNav, searchKeyword]);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadRef.current();
        }, []),
    );

    const onSearch = () => setSearchKeyword(keyword);

    const handleDelete = useCallback((item: MedicalRecord) => {
        const id = item.medicalRecordId;
        if (id == null) return;

        Alert.alert('删除病例', '确定删除该病例记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await removeMedicalRecord(id);
                        if (isResourceApiOk(res as { code?: number })) {
                            setItems(prev => prev.filter(r => r.medicalRecordId !== id));
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
    }, []);

    const renderItem = useCallback(
        ({ item }: { item: MedicalRecord }) => (
            <SwipeDeleteRow onDelete={() => handleDelete(item)}>
                <CaseNoteCard item={item} />
            </SwipeDeleteRow>
        ),
        [handleDelete],
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardDoneAccessory />
            <View style={styles.topBox}>
                <Flex style={styles.inputBox}>
                    <Image style={styles.inputIcon} source={require('@/assets/images/user/fdj.png')} />
                    <TextInput
                        style={styles.inputText}
                        placeholder="请输入病例名称"
                        placeholderTextColor={AppTheme.textSecondary}
                        value={keyword}
                        onChangeText={setKeyword}
                        returnKeyType="search"
                        onSubmitEditing={onSearch}
                        inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                    />
                </Flex>

                <Flex style={styles.navBox}>
                    {NAV_LIST.map(item => (
                        <TouchableOpacity
                            style={styles.navCol}
                            key={item.value}
                            onPress={() => {
                                if (item.value === activeNav) return;
                                setActiveNav(item.value);
                            }}>
                            <View style={styles.navItemWrap}>
                                <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>
                                    {item.label}
                                </Text>
                                {activeNav === item.value ? (
                                    <View style={styles.navIndicatorWrap}>
                                        <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                                    </View>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    ))}
                </Flex>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => String(item.medicalRecordId ?? `${item.recordDate}-${index}`)}
                    renderItem={renderItem}
                    contentContainerStyle={items.length === 0 ? styles.bodyEmpty : styles.body}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>暂无病例记录</Text>}
                    onScrollBeginDrag={closeActiveSwipeRow}
                />
            )}

            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CaseAdd')}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text style={styles.addText}>添加病例</Text>
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

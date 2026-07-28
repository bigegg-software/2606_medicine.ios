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
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { getMedicalRecordFrontList, removeMedicalRecord, type MedicalRecord } from '@/api/medicalRecord';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import SwipeDeleteRow, { closeActiveSwipeRow } from './components/SwipeDeleteRow';
import { buildMedicalRecordNavList } from './caseConstants';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import { formatCaseNoteDate, getCaseTypeTagColors } from './utils/caseNotesHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const NAV_LIST = buildMedicalRecordNavList();

function CaseNoteCard({ item }: { item: MedicalRecord }) {
    const navigation = useNavigation<Nav>();
    const typeLabel = item.medicalRecordType?.trim();
    const tagColors = getCaseTypeTagColors(typeLabel);
    return (
        <TouchableOpacity style={styles.caseBox} key={String(item.medicalRecordId ?? `${item.recordDate}-${item.hospital}`)} onPress={() => navigation.navigate('CaseDetail', { id: item.medicalRecordId || 0 })}>
            <Flex justify="between" align="center">
                <Flex align="center" style={styles.caseTitleWrap}>
                    <Text style={[styles.caseTitle, { flex: 1 }]}>
                        {item.hospital?.trim() || '—'}
                    </Text>
                    {typeLabel ? (
                        <View
                            style={[
                                styles.caseTypeTag,
                                {
                                    backgroundColor: tagColors.backgroundColor,
                                    borderColor: tagColors.borderColor,
                                },
                            ]}>
                            <Text style={[styles.caseTypeTagText, { color: tagColors.color }]}>
                                {typeLabel}
                            </Text>
                        </View>
                    ) : null}
                </Flex>
                <Text style={styles.caseTime}>{formatCaseNoteDate(item.recordDate)}</Text>
            </Flex>
            <View style={styles.caseLineWrap}>
                <View style={styles.caseLine} />
            </View>
            <View style={styles.caseContentBox}>
                <Text style={styles.caseContentText}>
                    <Text style={styles.caseContentLabel}>就诊科室：</Text>
                    <Text style={styles.caseContentValue}>
                        {item.medicalDepartment?.trim() || '—'}
                    </Text>
                </Text>
                <Text style={[styles.caseContentText, styles.caseContentTextSecond]} numberOfLines={1}>
                    <Text style={styles.caseContentLabel}>主治医师：</Text>
                    <Text style={styles.caseContentValue}>{item.doctor || '—'}</Text>
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function CaseNotesPage() {
    const navigation = useNavigation<Nav>();
    const [activeNav, setActiveNav] = useState('all');
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
                searchWords: searchKeyword.trim() || undefined,
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
        <PageLayout style={styles.container} edges={[]}>
            <KeyboardDoneAccessory />
            <View style={styles.topBox}>
                <Flex align="center" style={styles.inputBox}>
                    <Image style={styles.inputIcon} source={require('@/assets/images/user/fdj.png')} />
                    <TextInput
                        style={styles.inputText}
                        placeholder="请输入病例名称"
                        placeholderTextColor="#999999"
                        value={keyword}
                        onChangeText={setKeyword}
                        returnKeyType="search"
                        onSubmitEditing={onSearch}
                        inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                    />
                    <View style={styles.inputDivider} />
                    <TouchableOpacity activeOpacity={0.7} onPress={onSearch} hitSlop={8}>
                        <Text style={styles.inputSearchBtn}>搜索</Text>
                    </TouchableOpacity>
                </Flex>

                <Flex align="start" style={styles.navBox}>
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
                                    <View style={styles.navIndicator} />
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
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Image
                                style={styles.emptyImage}
                                source={require('@/assets/images/user/zwjl.png')}
                                resizeMode="contain"
                            />
                            <Text style={styles.emptyText}>暂无病例记录</Text>
                        </View>
                    }
                    onScrollBeginDrag={closeActiveSwipeRow}
                />
            )}

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomBarButtonLeft}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CaseAdd')}>
                    <Flex style={{ flex: 1 }}>
                        <Image
                            style={styles.bottomBarButtonImg}
                            source={require('@/assets/images/vitals/icon_add.png')}
                        />
                        <Text style={styles.bottomBarButtonTextLeft}>添加病例</Text>
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/community/community';
import type { RootStackParamList } from '@/route/router';
import { AppTheme } from '@/common/theme';
import {
    getActivityFrontList,
    joinActivity,
    leaveActivity,
    type ActivityItem,
} from '@/api/activity';
import { buildDictLabelMap, DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    formatActivitySignupCount,
    formatActivityStartTime,
    isNoticeActivity,
    toActivityId,
} from '../activityHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 10;
const DEFAULT_COVER = require('@/assets/images/home/head.png');

type ActivityTab = {
    label: string;
    value: string;
};

function getListTotal(res: { total?: number } | null | undefined, rowsLength: number) {
    const total = Number(res?.total);
    return Number.isFinite(total) && total >= 0 ? total : rowsLength;
}

export default function ActivityPage() {
    const navigation = useNavigation<Nav>();
    const [tabs, setTabs] = useState<ActivityTab[]>([{ label: '全部', value: '' }]);
    const [activeTab, setActiveTab] = useState('');
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [total, setTotal] = useState(0);
    const [pageNum, setPageNum] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});
    const [joiningId, setJoiningId] = useState('');

    const pageNumRef = useRef(pageNum);
    const totalRef = useRef(total);
    const activitiesRef = useRef(activities);
    const loadingMoreRef = useRef(false);
    const activeTabRef = useRef(activeTab);
    const lastFetchCountRef = useRef(0);

    pageNumRef.current = pageNum;
    totalRef.current = total;
    activitiesRef.current = activities;
    activeTabRef.current = activeTab;

    useEffect(() => {
        (async () => {
            const res = await getDictDataByType(DICT_TYPES.activityType);
            const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
            if (!isResourceApiOk(dictRes)) return;
            const labelMap = buildDictLabelMap(dictRes.data);
            setTypeLabelMap(labelMap);
            const dictTabs = Object.entries(labelMap).map(([value, label]) => ({ label, value }));
            setTabs([{ label: '全部', value: '' }, ...dictTabs]);
        })();
    }, []);

    const hasMoreData = useCallback((currentTotal: number, currentLength: number, lastFetchCount: number) => {
        if (currentTotal > 0) return currentLength < currentTotal;
        if (currentLength === 0) return false;
        return lastFetchCount >= PAGE_SIZE;
    }, []);

    const fetchPage = useCallback(async (
        page: number,
        tab: string,
        mode: 'initial' | 'refresh' | 'loadMore' | 'silent',
    ) => {
        if (mode === 'loadMore') {
            if (
                loadingMoreRef.current ||
                !hasMoreData(totalRef.current, activitiesRef.current.length, lastFetchCountRef.current)
            ) {
                return;
            }
            loadingMoreRef.current = true;
            setLoadingMore(true);
        } else if (mode === 'initial') {
            setLoading(true);
        } else if (mode === 'refresh') {
            setRefreshing(true);
        }

        try {
            const res = await getActivityFrontList({
                pageNum: page,
                pageSize: PAGE_SIZE,
                activityType: tab || undefined,
            });

            if (!isResourceApiOk(res as { code?: number })) {
                if (mode !== 'loadMore' && tab === activeTabRef.current) {
                    setActivities([]);
                    setTotal(0);
                    setPageNum(1);
                }
                return;
            }

            const rows = getResourceRows<ActivityItem>(res as { code?: number; rows?: ActivityItem[] });
            const responseTotal = getListTotal(res as { total?: number }, rows.length);

            if (mode !== 'loadMore' && tab !== activeTabRef.current) {
                return;
            }

            if (mode === 'loadMore') {
                setActivities(prev => [...prev, ...rows]);
            } else {
                setActivities(rows);
            }
            setTotal(responseTotal);
            setPageNum(page);
            lastFetchCountRef.current = rows.length;
        } catch {
            if (mode !== 'loadMore' && tab === activeTabRef.current) {
                setActivities([]);
                setTotal(0);
                setPageNum(1);
            }
        } finally {
            if (mode === 'loadMore') {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            } else if (mode === 'initial') {
                setLoading(false);
            } else if (mode === 'refresh') {
                setRefreshing(false);
            }
        }
    }, [hasMoreData]);

    useFocusEffect(
        useCallback(() => {
            void fetchPage(1, activeTabRef.current, 'initial');
        }, [fetchPage]),
    );

    const handleTabChange = useCallback((tab: string) => {
        setActiveTab(tab);
        activeTabRef.current = tab;
        void fetchPage(1, tab, 'initial');
    }, [fetchPage]);

    const handleRefresh = useCallback(() => {
        void fetchPage(1, activeTabRef.current, 'refresh');
    }, [fetchPage]);

    const handleLoadMore = useCallback(() => {
        void fetchPage(pageNumRef.current + 1, activeTabRef.current, 'loadMore');
    }, [fetchPage]);

    const openActivityDetail = useCallback((item: ActivityItem) => {
        const activityId = toActivityId(item.activityId);
        if (!activityId) return;
        navigation.navigate('ActivityDetail', { id: activityId });
    }, [navigation]);

    const handleToggleSignup = useCallback(async (item: ActivityItem) => {
        const activityId = toActivityId(item.activityId);
        if (!activityId || joiningId) return;

        const nextJoined = !item.isBm;
        setJoiningId(activityId);
        try {
            const res = nextJoined
                ? await joinActivity(activityId)
                : await leaveActivity(activityId);
            if (isResourceApiOk(res as { code?: number })) {
                setActivities(prev =>
                    prev.map(row =>
                        toActivityId(row.activityId) === activityId
                            ? {
                                ...row,
                                isBm: nextJoined,
                                signupCount: Math.max(
                                    0,
                                    Number(row.signupCount ?? 0) + (nextJoined ? 1 : -1),
                                ),
                            }
                            : row,
                    ),
                );
                Alert.alert('提示', nextJoined ? '报名成功' : '已取消报名');
            } else {
                Alert.alert('失败', (res as { msg?: string }).msg ?? '请稍后重试');
            }
        } catch {
            Alert.alert('失败', '请稍后重试');
        } finally {
            setJoiningId('');
        }
    }, [joiningId]);

    const renderNoticeItem = (item: ActivityItem) => (
        <TouchableOpacity
            key={toActivityId(item.activityId)}
            activeOpacity={0.85}
            onPress={() => openActivityDetail(item)}>
            <Text style={styles.timeText}>{formatActivityStartTime(item.activityStartTime)}</Text>
            <View style={styles.newDynamicBox}>
                <View style={styles.newDynamicContent}>
                    <Text style={[styles.mapBoxItemTitle, { textAlign: 'center' }]}>
                        {item.activityName?.trim() || '通知提醒'}
                    </Text>
                    <Text style={[styles.newDynamicContentText, { marginTop: 12 }]}>
                        {item.activityRemark?.trim() || item.activityDetail?.trim() || '暂无内容'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderActivityItem = (item: ActivityItem) => {
        const activityId = toActivityId(item.activityId);
        const typeLabel = item.activityType ? typeLabelMap[item.activityType] ?? item.activityType : '';
        const coverSource = item.coverOssUrl?.trim() ? { uri: item.coverOssUrl } : DEFAULT_COVER;
        const joining = joiningId === activityId;

        if (isNoticeActivity(item, typeLabel)) {
            return renderNoticeItem(item);
        }

        return (
            <TouchableOpacity
                style={styles.mapBoxItem}
                activeOpacity={0.85}
                onPress={() => openActivityDetail(item)}>
                <Flex style={{ flex: 1 }}>
                    <Image source={coverSource} style={styles.mapBoxItemImg} />
                    <View style={styles.mapRightBox}>
                        <Flex justify="between" align="start">
                            <Text style={[styles.mapBoxItemTitle, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
                                {item.activityName?.trim() || '活动'}
                            </Text>
                            <TouchableOpacity
                                disabled={joining}
                                onPress={event => {
                                    event.stopPropagation();
                                    void handleToggleSignup(item);
                                }}>
                                <Flex style={item.isBm ? styles.mapRightBtn : styles.wbmBtn}>
                                    <Text style={item.isBm ? styles.mapRightText : styles.wbmText}>
                                        {joining ? '处理中' : item.isBm ? '已报名' : '报名'}
                                    </Text>
                                </Flex>
                            </TouchableOpacity>
                        </Flex>
                        <Text style={styles.mapIntro} numberOfLines={2}>
                            {item.activityRemark?.trim() || item.activityDetail?.trim() || '欢迎参加'}
                        </Text>
                    </View>
                </Flex>
                <Flex justify='between' style={{ marginTop: 12 }}>
                    <Flex>
                        <Image style={styles.mapIcon} source={require('@/assets/images/home/nz.png')} />
                        <Text style={styles.mapText}>{formatActivityStartTime(item.activityStartTime)}</Text>
                    </Flex>
                    {item.activityLocation?.trim() ? (
                        <Flex>
                            <Image style={styles.mapIcon} source={require('@/assets/images/home/dw.png')} />
                            <Text style={styles.mapText} numberOfLines={1}>
                                {item.activityLocation.trim()}
                            </Text>
                        </Flex>
                    ) : null}
                    <Flex>
                        <Image style={styles.mapIcon} source={require('@/assets/images/community/user.png')} />
                        <Text style={styles.mapText}>{formatActivitySignupCount(item.signupCount)}</Text>
                    </Flex>
                </Flex>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <Flex justify="around" style={styles.navBox}>
            {tabs.map(item => {
                const selected = activeTab === item.value;
                return (
                    <TouchableOpacity
                        style={styles.navCol}
                        key={item.value || 'all'}
                        onPress={() => handleTabChange(item.value)}>
                        <View style={styles.navItemWrap}>
                            <Text style={[styles.navText, selected && styles.activeNavText]}>{item.label}</Text>
                            {selected ? (
                                <View style={styles.navIndicatorWrap}>
                                    <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </Flex>
    );

    if (loading && activities.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
        );
    }

    return (
        <FlatList
            data={activities}
            keyExtractor={(item, index) => toActivityId(item.activityId) || `activity-${index}`}
            renderItem={({ item }) => renderActivityItem(item)}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
                <Text style={[styles.mapIntro, { textAlign: 'center', marginTop: 40 }]}>暂无活动</Text>
            }
            contentContainerStyle={styles.scroll}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppTheme.primaryColor} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
                loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={AppTheme.primaryColor} /> : null
            }
        />
    );
}

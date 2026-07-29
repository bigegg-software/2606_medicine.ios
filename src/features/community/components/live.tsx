import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
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
    getLiveStreamList,
    toggleLiveStreamReservation,
    type LiveStreamItem,
} from '@/api/liveStream';
import { buildDictLabelMap, DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    formatLiveStartTime,
    getLiveStatusText,
    toLiveId,
} from '../liveHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_COVER = require('@/assets/images/home/head.png');
const LIVE_PAGE_SIZE = 20;

export default function LivePage() {
    const navigation = useNavigation<Nav>();
    const [livingList, setLivingList] = useState<LiveStreamItem[]>([]);
    const [previewList, setPreviewList] = useState<LiveStreamItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reservingId, setReservingId] = useState('');
    const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});

    useEffect(() => {
        (async () => {
            const res = await getDictDataByType(DICT_TYPES.liveType);
            const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
            if (isResourceApiOk(dictRes)) {
                setTypeLabelMap(buildDictLabelMap(dictRes.data));
            }
        })();
    }, []);

    const loadLiveData = useCallback(async () => {
        setLoading(true);
        try {
            const [livingRes, previewRes] = await Promise.all([
                getLiveStreamList({ status: 1, pageNum: 1, pageSize: LIVE_PAGE_SIZE }),
                getLiveStreamList({ status: 0, pageNum: 1, pageSize: LIVE_PAGE_SIZE }),
            ]);

            setLivingList(
                isResourceApiOk(livingRes as { code?: number })
                    ? getResourceRows<LiveStreamItem>(livingRes as { code?: number; rows?: LiveStreamItem[] })
                    : [],
            );
            setPreviewList(
                isResourceApiOk(previewRes as { code?: number })
                    ? getResourceRows<LiveStreamItem>(previewRes as { code?: number; rows?: LiveStreamItem[] })
                    : [],
            );
        } catch {
            setLivingList([]);
            setPreviewList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadLiveData();
        }, [loadLiveData]),
    );

    const openLiveDetail = useCallback((item: LiveStreamItem) => {
        const liveId = toLiveId(item.liveId);
        if (!liveId) return;
        navigation.navigate('LiveDetail', { liveId });
    }, [navigation]);

    const handleToggleReservation = useCallback(async (item: LiveStreamItem) => {
        const liveId = toLiveId(item.liveId);
        if (!liveId || reservingId) return;

        const nextStatus = !item.isReserved;
        setReservingId(liveId);
        try {
            const res = await toggleLiveStreamReservation({ liveId, status: nextStatus });
            if (isResourceApiOk(res as { code?: number })) {
                const data = apiResourceData<{ status?: boolean }>(
                    res as { code?: number; data?: { status?: boolean } },
                );
                const reserved = data?.status ?? nextStatus;
                setPreviewList(prev =>
                    prev.map(row =>
                        toLiveId(row.liveId) === liveId ? { ...row, isReserved: reserved } : row,
                    ),
                );
                Alert.alert('提示', reserved ? '预约成功' : '已取消预约');
            } else {
                Alert.alert('失败', (res as { msg?: string }).msg ?? '请稍后重试');
            }
        } catch {
            Alert.alert('失败', '请稍后重试');
        } finally {
            setReservingId('');
        }
    }, [reservingId]);

    const renderLiveTopCard = (item: LiveStreamItem) => {
        const coverSource = item.coverOssUrl?.trim() ? { uri: item.coverOssUrl } : DEFAULT_COVER;
        const typeLabel = item.liveType ? typeLabelMap[item.liveType] ?? item.liveType : '';

        return (
            <TouchableOpacity
                key={toLiveId(item.liveId)}
                style={styles.liveTopBox}
                activeOpacity={0.85}
                onPress={() => openLiveDetail(item)}>
                <View style={styles.liveTopImgWrap}>
                    <Image source={coverSource} style={styles.liveTopImg} resizeMode="cover" />
                    {typeLabel ? (
                        <Flex justify='center' style={styles.liveTopCategoryTag}>
                            <Text style={styles.liveTopCategoryText}>{typeLabel}</Text>
                        </Flex>
                    ) : null}
                    <Text style={styles.gkrsText}>{item.viewCount}人次观看</Text>
                    <View style={styles.liveTopLiveTag}>
                        <Image source={require('@/assets/images/community/zb.png')} style={styles.liveTopLiveDot} />
                        <Text style={styles.liveTopLiveText}>
                            {getLiveStatusText(item.status, item.statusName)}
                        </Text>
                    </View>
                </View>
                <View style={styles.liveTopInfo}>
                    <Text style={styles.liveTopText} numberOfLines={1}>
                        {item.title?.trim() || '直播'}
                    </Text>
                    <Text style={styles.liveTopIntro} numberOfLines={2}>
                        {item.liveIntro?.trim() || '欢迎进入直播间'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderPreviewItem = (item: LiveStreamItem) => {
        const liveId = toLiveId(item.liveId);
        const coverSource = item.coverOssUrl?.trim() ? { uri: item.coverOssUrl } : DEFAULT_COVER;
        const typeLabel = item.liveType ? typeLabelMap[item.liveType] ?? item.liveType : '';
        const reserving = reservingId === liveId;

        return (
            <TouchableOpacity
                key={liveId}
                style={styles.mapBoxItem}
                activeOpacity={0.85}
                onPress={() => openLiveDetail(item)}>
                <Flex>
                    <View style={styles.liveImgWrap}>
                        <Image source={coverSource} style={styles.liveImg} />
                        <View style={styles.livePreviewTag}>
                            <Image
                                source={require('@/assets/images/community/icon_yg.png')}
                                style={styles.livePreviewTagIcon}
                            />
                            <Text style={styles.livePreviewTagText}>直播预告</Text>
                        </View>
                    </View>
                    <View style={styles.liveMapBox}>
                        <Flex justify="between" align="start">
                            <Text style={[styles.mapBoxItemTitle, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
                                {item.title?.trim() || '直播预告'}
                            </Text>
                            {typeLabel ? (
                                <Flex style={styles.wbmBtn}>
                                    <Text style={styles.wbmText}>{typeLabel}</Text>
                                </Flex>
                            ) : null}
                        </Flex>
                        <Text style={styles.mapIntro} numberOfLines={2}>
                            {item.liveIntro?.trim() || '敬请期待'}
                        </Text>
                        <Flex justify='between' style={{ marginTop: 6 }}>
                            <Flex>
                                <Image style={styles.mapIcon} source={require('@/assets/images/community/nz.png')} />
                                <Text style={styles.mapText}>{formatLiveStartTime(item.liveStartTime)}</Text>
                            </Flex>
                            <Flex align="center">
                                <Image style={styles.mapIcon} source={require('@/assets/images/community/user.png')} />
                                <Text style={styles.mapText}>
                                    主播: {item.anchorName?.trim() || '--'}
                                </Text>
                            </Flex>
                        </Flex>
                    </View>
                </Flex>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
        );
    }

    return (
        <View>
            {livingList.length > 0 ? (
                <>
                    <Flex align="center" style={styles.sectionTitleRow}>
                        <Image
                            source={require('@/assets/images/community/zb.png')}
                            style={styles.sectionTitleIcon}
                        />
                        <Text style={styles.sectionTitleText}>直播中</Text>
                    </Flex>
                    <ScrollView
                        horizontal
                        nestedScrollEnabled
                        removeClippedSubviews={false}
                        showsHorizontalScrollIndicator={false}
                        style={styles.liveTopScroll}
                        contentContainerStyle={styles.liveTopScrollContent}>
                        {livingList.map(renderLiveTopCard)}
                    </ScrollView>
                </>
            ) : null}
            <Flex align="center" style={styles.sectionTitleRow}>
                <Image
                    source={require('@/assets/images/community/icon_yg.png')}
                    style={styles.sectionTitleIcon}
                />
                <Text style={styles.sectionTitleText}>直播预告</Text>
            </Flex>
            <View>
                <View style={styles.mapBox}>
                    {previewList.length === 0 ? (
                        <Text style={[styles.mapIntro, { textAlign: 'center', paddingVertical: 20 }]}>
                            暂无直播预告
                        </Text>
                    ) : (
                        previewList.map(renderPreviewItem)
                    )}
                </View>
            </View>
        </View>
    );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    ActivityIndicator,
    ImageSourcePropType,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/community';
import type { RootState } from '@/store/store';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import {
    findMyRankingEntry,
    formatMyRankLabel,
    loadRankingDisplayList,
    resolveRankingAvatarSource,
    type RankingDisplayItem,
    type RankingTab,
} from '../utils/rankingHelpers';

const PODIUM_FRAMES = [
    require('@/assets/images/community/image2.png'),
    require('@/assets/images/community/image1.png'),
    require('@/assets/images/community/image3.png'),
] as const;
const PODIUM_ORDER = [1, 0, 2] as const;

const RANKING_TABS: { key: RankingTab; label: string; icon: ImageSourcePropType }[] = [
    { key: 'growth', label: '成长成果榜', icon: require('@/assets/images/community/icon_cz.png') },
    { key: 'vitality', label: '活力打卡榜', icon: require('@/assets/images/community/icon_hl.png') },
];

function RankBadge({
    rank,
    labelStyle,
    wrapStyle,
}: {
    rank: number | string;
    labelStyle?: object;
    wrapStyle?: object;
}) {
    return (
        <View style={[styles.rankNumWrap, wrapStyle]}>
            <Text style={[styles.rankNumText, labelStyle]}>{rank}</Text>
        </View>
    );
}

function RankingRow({
    rankLabel,
    name,
    subtitle,
    trailing,
    avatarSource,
    rankLabelStyle,
}: {
    rankLabel: string;
    name: string;
    subtitle: string;
    trailing: string;
    avatarSource: ImageSourcePropType;
    rankLabelStyle?: object;
}) {
    return (
        <Flex style={styles.rankingItemBox}>
            <RankBadge rank={rankLabel} labelStyle={rankLabelStyle} />
            <Image source={avatarSource} style={styles.listImg} />
            <View style={styles.rankingListInfo}>
                <Text style={styles.rankingItemText}>{name}</Text>
                <Text style={styles.rankingItemText2} >{subtitle}</Text>
            </View>
            <Text style={styles.avatarValue}>{trailing}</Text>
        </Flex>
    );
}

function PodiumItem({
    item,
    rankIndex,
    frameSource,
}: {
    item?: RankingDisplayItem;
    rankIndex: number;
    frameSource: ImageSourcePropType;
}) {
    const name = item?.nickName?.trim() || '暂无';
    const subtitle = item?.subtitle || '--';
    const trailing = item?.trailing || '--';

    return (
        <View style={[
            styles.podiumWrap,
            rankIndex === 0 && styles.podiumWrapFirst,
        ]}>
            <Flex
                direction="column"
                align="center"
                style={styles.podiumInner}>
                <Image
                    source={resolveRankingAvatarSource(item?.avatar)}
                    style={[styles.headImg, rankIndex === 0 && styles.headImgFirst]}
                />
                <View style={[styles.headBg, rankIndex === 0 && styles.headBgFirst]}>
                    <Image
                        style={[styles.headBg, rankIndex === 0 && styles.headBgFirst]}
                        source={frameSource}
                    />
                    <View style={styles.headBgContent}>
                        <Text
                            style={[
                                styles.rankingItemText,
                                { textAlign: 'center' },
                                rankIndex === 0 && styles.rankingItemTextFirst,
                                rankIndex === 1 && { color: '#6B738C' },
                                rankIndex === 2 && { color: '#A56125' },
                            ]}
                            numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.rankingItemText3} numberOfLines={1}>{subtitle}</Text>
                        <Text style={styles.rankingItemText4} numberOfLines={1}>{trailing}</Text>
                    </View>
                </View>
            </Flex>
        </View>
    );
}

export default function RankingPage() {
    const currentUserId = useSelector(
        (state: RootState) => state.user.info?.userId ?? state.user.systemUser?.userId,
    );
    const currentUserName = useSelector(
        (state: RootState) =>
            state.user.info?.name?.trim() ||
            state.user.systemUser?.nickName?.trim() ||
            state.user.systemUser?.realName?.trim() ||
            '',
    );
    const currentUserAvatar = useSelector((state: RootState) => state.user.info?.avatarOssUrl);
    const currentUserGender = useSelector((state: RootState) => state.user.info?.gender);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<RankingTab>('growth');
    const [rankingList, setRankingList] = useState<RankingDisplayItem[]>([]);
    const cacheByTabRef = useRef<Partial<Record<RankingTab, RankingDisplayItem[]>>>({});

    const loadRanking = useCallback(async (
        tab: RankingTab,
        mode: 'initial' | 'refresh' | 'switch' = 'initial',
    ) => {
        if (mode === 'refresh') {
            setRefreshing(true);
        } else if (mode === 'switch' && cacheByTabRef.current[tab]) {
            setRankingList(cacheByTabRef.current[tab] ?? []);
            return;
        } else {
            setLoading(true);
        }
        try {
            const list = await loadRankingDisplayList(tab);
            cacheByTabRef.current[tab] = list;
            setRankingList(list);
        } catch {
            cacheByTabRef.current[tab] = [];
            setRankingList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadRanking('growth', 'initial');
    }, [loadRanking]);

    const handleRefresh = useCallback(() => {
        void loadRanking(activeTab, 'refresh');
    }, [activeTab, loadRanking]);

    const handleTabPress = useCallback((tab: RankingTab) => {
        setActiveTab(prev => {
            if (prev === tab) return prev;
            void loadRanking(tab, 'switch');
            return tab;
        });
    }, [loadRanking]);

    const topThree = useMemo(() => rankingList.slice(0, 3), [rankingList]);
    const listItems = useMemo(() => rankingList.slice(3), [rankingList]);

    const myEntry = useMemo(
        () => findMyRankingEntry(rankingList, currentUserId),
        [currentUserId, rankingList],
    );

    const myRankLabel = formatMyRankLabel(myEntry?.sort);
    const myRankUnlisted = myRankLabel === '未上榜';
    const myName = myEntry?.nickName?.trim() || currentUserName || '我';
    const mySubtitle = myEntry?.subtitle || (activeTab === 'vitality' ? '打卡0天' : '暂无改善数据');
    const myTrailing = myEntry?.trailing || '0分钟';
    const myAvatarSource = myEntry?.avatar
        ? resolveRankingAvatarSource(myEntry.avatar, currentUserGender)
        : currentUserAvatar
            ? { uri: currentUserAvatar }
            : getDefaultAvatarByGender(currentUserGender);

    if (loading && !refreshing) {
        return (
            <View style={[styles.rankingPage, styles.center]}>
                <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
        );
    }

    return (
        <View style={styles.rankingPage}>
            <ScrollView
                style={styles.rankingScroll}
                contentContainerStyle={styles.rankingScrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[AppTheme.primaryColor]}
                        tintColor={AppTheme.primaryColor}
                    />
                }>
                <Flex style={styles.tabBox}>
                    {RANKING_TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                activeOpacity={0.85}
                                onPress={() => handleTabPress(tab.key)}
                                style={[styles.tabItem, isActive && styles.tabItemActive]}
                            >
                                <Flex justify="center" style={{ flex: 1 }}>
                                    <Image style={styles.tabItemIcon} source={tab.icon} />
                                    <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                                        {tab.label}
                                    </Text>
                                </Flex>
                            </TouchableOpacity>
                        );
                    })}
                </Flex>

                <Flex justify="center" style={styles.rankingBpx}>
                    {PODIUM_ORDER.map((rankIndex, displayIndex) => (
                        <PodiumItem
                            key={rankIndex}
                            rankIndex={rankIndex}
                            item={topThree[rankIndex]}
                            frameSource={PODIUM_FRAMES[displayIndex]}
                        />
                    ))}
                </Flex>

                {rankingList.length === 0 ? (
                    <View style={[styles.center, { marginTop: 24 }]}>
                        <Text style={styles.rankingItemText2}>暂无排行榜数据</Text>
                    </View>
                ) : (
                    <>
                        {listItems.map(item => (
                            <RankingRow
                                key={item.key}
                                rankLabel={String(item.sort)}
                                name={item.nickName}
                                subtitle={item.subtitle}
                                trailing={item.trailing}
                                avatarSource={resolveRankingAvatarSource(item.avatar)}
                            />
                        ))}
                        <Text style={styles.rankingUpdateHint}>温馨提示：每小时更新1次，按本月数据统计</Text>
                    </>
                )}
            </ScrollView>

            <View style={styles.rankingMeBar}>
                <Flex align="center" style={styles.rankingMeItemBox}>
                    <RankBadge
                        rank={myRankLabel}
                        wrapStyle={myRankUnlisted ? styles.rankNumWrapUnlisted : undefined}
                        labelStyle={myRankUnlisted ? styles.rankNumTextUnlisted : undefined}
                    />
                    <Image source={myAvatarSource} style={styles.listImg} />
                    <View style={styles.rankingListInfo}>
                        <Text style={styles.rankingItemText}>{myName}</Text>
                        <Text style={styles.rankingItemText2} numberOfLines={1}>{mySubtitle}</Text>
                    </View>
                    <Text style={styles.avatarValue}>{myTrailing}</Text>
                </Flex>
            </View>
        </View>
    );
}

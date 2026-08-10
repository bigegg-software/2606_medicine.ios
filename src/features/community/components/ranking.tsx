import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, ImageSourcePropType, TouchableOpacity, RefreshControl } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/community';
import { getRankingList, type RankingItem } from '@/api/ranking';
import { apiResourceData } from '@/src/utils/apiHelpers';
import type { RootState } from '@/store/store';

import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';

const PODIUM_FRAMES = [
    require('@/assets/images/community/image2.png'),
    require('@/assets/images/community/image1.png'),
    require('@/assets/images/community/image3.png'),
] as const;
const PODIUM_ORDER = [1, 0, 2] as const;

type RankingTab = 'growth' | 'vitality';

const RANKING_TABS: { key: RankingTab; label: string; icon: ImageSourcePropType }[] = [
    { key: 'growth', label: '成长成果榜', icon: require('@/assets/images/community/icon_cz.png') },
    { key: 'vitality', label: '活力打卡榜', icon: require('@/assets/images/community/icon_hl.png') },
];

const PODIUM_SCORE_COLORS: Record<number, string> = {
    0: '#FEAB27',
    1: '#9BAAD8',
    2: '#EC8E63',
};

function RankBadge({ rank, labelStyle }: { rank: number | string; labelStyle?: object }) {
    return (
        <View style={styles.rankNumWrap}>
            <Text style={[styles.rankNumText, labelStyle]}>{rank}</Text>
        </View>
    );
}

type RankingRowProps = {
    rankLabel: string;
    name: string;
    streak: string;
    score: number;
    avatarSource: ImageSourcePropType;
    rankLabelStyle?: object;
    scoreColor?: string;
};

function formatStreak(days?: number) {
    const value = Number.isFinite(days) ? Math.max(0, Math.round(days as number)) : 0;
    return `连续${value}天`;
}

function formatScore(value?: number) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
}

function resolveAvatarSource(
    avatar?: number | string,
    gender?: string | number | null,
): ImageSourcePropType {
    if (typeof avatar === 'string' && /^https?:\/\//.test(avatar)) {
        return { uri: avatar };
    }
    return getDefaultAvatarByGender(gender == null ? undefined : String(gender));
}

function sortRankingList(list: RankingItem[]) {
    return [...list].sort((a, b) => {
        const sortA = a.sort ?? Number.MAX_SAFE_INTEGER;
        const sortB = b.sort ?? Number.MAX_SAFE_INTEGER;
        if (sortA !== sortB) return sortA - sortB;
        return (b.tokens ?? 0) - (a.tokens ?? 0);
    });
}

function RankingRow({
    rankLabel,
    name,
    streak,
    score,
    avatarSource,
    rankLabelStyle,
    scoreColor = '#333',
}: RankingRowProps) {
    return (
        <Flex style={styles.rankingItemBox}>
            <RankBadge rank={rankLabel} labelStyle={rankLabelStyle} />
            <Image source={avatarSource} style={styles.listImg} />
            <View style={styles.rankingListInfo}>
                <Text style={styles.rankingItemText}>{name}</Text>
                <Text style={styles.rankingItemText2}>空腹血糖下降0.9</Text>
            </View>
            <Text style={styles.avatarValue}>3个月</Text>
        </Flex>
    );
}

function PodiumItem({
    item,
    rankIndex,
    frameSource,
}: {
    item?: RankingItem;
    rankIndex: number;
    frameSource: ImageSourcePropType;
}) {
    const name = item?.nickName?.trim() || '暂无';
    const score = item?.tokens ?? 0;
    const scoreColor = PODIUM_SCORE_COLORS[rankIndex] ?? PODIUM_SCORE_COLORS[2];

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
                    source={resolveAvatarSource(item?.avatar, item?.gender)}
                    style={[styles.headImg, rankIndex === 0 && styles.headImgFirst]}
                />
                <View style={[styles.headBg, rankIndex === 0 && styles.headBgFirst]}>
                    <Image
                        style={[styles.headBg, rankIndex === 0 && styles.headBgFirst]}
                        source={frameSource}
                    />
                    <View style={styles.headBgContent}>
                        <Text
                            style={[styles.rankingItemText, { textAlign: "center" }, rankIndex === 0 && styles.rankingItemTextFirst,
                                , rankIndex === 1 && {
                                    color: '#6B738C'
                                }, rankIndex === 2 && {
                                    color: '#A56125'
                                }]}
                            numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.rankingItemText3}>空腹血糖下降1.8</Text>
                        <Text style={styles.rankingItemText4}>3个月</Text>
                        {/* <Flex justify='center' style={styles.rankingScoreRow}>
                            <Image
                                style={styles.avatarIcon}
                                tintColor={scoreColor}
                                source={require('@/assets/images/community/jf.png')}
                            />
                            <Text style={[styles.avatarValue]}>{formatScore(score)}</Text>
                        </Flex> */}
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
    const [rankingList, setRankingList] = useState<RankingItem[]>([]);

    const loadRanking = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'refresh') {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const res = (await getRankingList()) as unknown as { code?: number; data?: RankingItem[] };
            const data = apiResourceData<RankingItem[]>(res);
            setRankingList(Array.isArray(data) ? sortRankingList(data) : []);
        } catch {
            setRankingList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadRanking('initial');
    }, [loadRanking]);

    const handleRefresh = useCallback(() => {
        void loadRanking('refresh');
    }, [loadRanking]);

    const topThree = useMemo(() => rankingList.slice(0, 3), [rankingList]);
    const listItems = useMemo(() => rankingList.slice(3, 10), [rankingList]);

    const myEntry = useMemo(
        () => rankingList.find(item => item.userId != null && item.userId === currentUserId),
        [currentUserId, rankingList],
    );

    const myRankLabel = myEntry?.sort != null ? String(myEntry.sort) : '—';
    const myName = myEntry?.nickName?.trim() || currentUserName || '我';
    const myStreak = formatStreak(myEntry?.continuousDays);
    const myScore = myEntry?.tokens ?? 0;
    const myAvatarSource = myEntry?.avatar
        ? resolveAvatarSource(myEntry.avatar, myEntry.gender ?? currentUserGender)
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
                                onPress={() => setActiveTab(tab.key)}
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
                                key={String(item.id ?? `${item.userId}-${item.sort}`)}
                                rankLabel={String(item.sort ?? '-')}
                                name={item.nickName?.trim() || '用户'}
                                streak={formatStreak(item.continuousDays)}
                                score={item.tokens ?? 0}
                                avatarSource={resolveAvatarSource(item.avatar, item.gender)}
                            />
                        ))}
                        <Text style={styles.rankingUpdateHint}>每小时更新</Text>
                    </>
                )}
            </ScrollView>

            <View style={styles.rankingMeBar}>
                <Flex style={styles.rankingMeItemBox}>
                    <RankBadge rank={myRankLabel} />
                    <Image source={myAvatarSource} style={styles.listImg} />
                    <View style={styles.rankingListInfo}>
                        <Text style={styles.rankingItemText}>{myName}</Text>
                        <Text style={styles.rankingItemText2}>空腹血糖下降0.9</Text>
                    </View>
                    <Text style={styles.avatarValue}>3个月</Text>
                </Flex>
            </View>
        </View>
    );
}

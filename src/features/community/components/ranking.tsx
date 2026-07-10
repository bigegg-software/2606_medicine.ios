import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/community';
import { getRankingList, type RankingItem } from '@/api/ranking';
import { apiResourceData } from '@/src/utils/apiHelpers';
import type { RootState } from '@/store/store';

import { DEFAULT_AVATAR, getDefaultAvatarByGender } from '@/src/utils/userHelpers';
const PODIUM_FRAMES = [
    require('@/assets/images/community/image2.png'),
    require('@/assets/images/community/image1.png'),
    require('@/assets/images/community/image3.png'),
] as const;
const PODIUM_ORDER = [1, 0, 2] as const;

const PODIUM_SCORE_COLORS: Record<number, string> = {
    0: '#FEAB27',
    1: '#9BAAD8',
    2: '#EC8E63',
};

const RANK_NUM_ICONS: Record<number, ImageSourcePropType> = {
    1: require('@/assets/images/community/num1.png'),
    2: require('@/assets/images/community/num2.png'),
    3: require('@/assets/images/community/num3.png'),
    4: require('@/assets/images/community/num4.png'),
    5: require('@/assets/images/community/num5.png'),
    6: require('@/assets/images/community/num6.png'),
    7: require('@/assets/images/community/num7.png'),
    8: require('@/assets/images/community/num8.png'),
    9: require('@/assets/images/community/num9.png'),
    10: require('@/assets/images/community/num10.png'),
};

function parseRankNumber(rank: number | string) {
    const num = typeof rank === 'number' ? rank : Number.parseInt(rank, 10);
    return Number.isFinite(num) ? num : null;
}

function RankBadge({ rank, labelStyle }: { rank: number | string; labelStyle?: object }) {
    const rankNum = parseRankNumber(rank);
    const icon = rankNum != null ? RANK_NUM_ICONS[rankNum] : undefined;

    if (icon) {
        return (
            <View style={styles.rankNumWrap}>
                <Image source={icon} style={styles.rankNumIcon} />
            </View>
        );
    }

    return <Text style={[styles.numBox, labelStyle]}>{rank}</Text>;
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

function resolveAvatarSource(avatar?: number | string): ImageSourcePropType {
    if (typeof avatar === 'string' && /^https?:\/\//.test(avatar)) {
        return { uri: avatar };
    }
    return DEFAULT_AVATAR;
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
                <Text style={styles.rankingItemText2}>{streak}</Text>
            </View>
            <Flex>
                <Image style={styles.avatarIcon} tintColor="#6D925E" source={require('@/assets/images/community/jf.png')} />
                <Text style={[styles.avatarValue, { color: scoreColor }]}>{formatScore(score)}</Text>
            </Flex>
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
                    source={resolveAvatarSource(item?.avatar)}
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
                        <Flex justify='center' style={styles.rankingScoreRow}>
                            <Image
                                style={styles.avatarIcon}
                                tintColor={scoreColor}
                                source={require('@/assets/images/community/jf.png')}
                            />
                            <Text style={[styles.avatarValue]}>{formatScore(score)}</Text>
                        </Flex>
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
    const [rankingList, setRankingList] = useState<RankingItem[]>([]);

    const loadRanking = useCallback(async () => {
        setLoading(true);
        try {
            const res = (await getRankingList()) as unknown as { code?: number; data?: RankingItem[] };
            const data = apiResourceData<RankingItem[]>(res);
            setRankingList(Array.isArray(data) ? sortRankingList(data) : []);
        } catch {
            setRankingList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRanking();
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
        ? resolveAvatarSource(myEntry.avatar)
        : currentUserAvatar
            ? { uri: currentUserAvatar }
            : getDefaultAvatarByGender(currentUserGender);

    if (loading) {
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
                showsVerticalScrollIndicator={false}>
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
                                avatarSource={resolveAvatarSource(item.avatar)}
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
                        <Text style={styles.rankingItemText2}>{myStreak}</Text>
                    </View>
                    <Flex>
                        <Image
                            style={styles.avatarIcon}
                            tintColor="#6D925E"
                            source={require('@/assets/images/community/jf.png')} />
                        <Text style={[styles.avatarValue, { color: '#333', fontSize: 18 }]}>{formatScore(myScore)}</Text>
                    </Flex>
                </Flex>
            </View>
        </View>
    );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/community';
import { getRankingList, type RankingItem } from '@/api/ranking';
import { apiResourceData } from '@/src/utils/apiHelpers';
import type { RootState } from '@/store/store';

const DEFAULT_AVATAR = require('@/assets/images/home/head.png');
const PODIUM_FRAMES = [
    require('@/assets/images/community/image2.png'),
    require('@/assets/images/community/image1.png'),
    require('@/assets/images/community/image3.png'),
] as const;
const PODIUM_ORDER = [1, 0, 2] as const;

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
            <Text style={[styles.numBox, rankLabelStyle]}>{rankLabel}</Text>
            <Image source={avatarSource} style={styles.listImg} />
            <View style={styles.rankingListInfo}>
                <Text style={styles.rankingItemText}>{name}</Text>
                <Text style={styles.rankingItemText2}>{streak}</Text>
            </View>
            <Flex style={styles.rankingScoreRow}>
                <Image style={styles.avatarIcon} tintColor="#333" source={require('@/assets/images/user/img1.png')} />
                <Text style={[styles.avatarValue, { color: scoreColor }]}>{formatScore(score)}</Text>
            </Flex>
        </Flex>
    );
}

function PodiumItem({
    item,
    frameSource,
    marginTop,
    scoreColor,
}: {
    item?: RankingItem;
    frameSource: ImageSourcePropType;
    marginTop?: number;
    scoreColor?: string;
}) {
    const name = item?.nickName?.trim() || '暂无';
    const score = item?.tokens ?? 0;

    return (
        <Flex direction="column" style={[styles.rankingItem, marginTop != null && { marginTop }]}>
            <Flex style={styles.headImgBox}>
                <Image source={resolveAvatarSource(item?.avatar)} style={styles.headImg} />
                <Image style={styles.headBg} source={frameSource} />
            </Flex>
            <Text style={styles.rankingItemText} numberOfLines={1}>
                {name}
            </Text>
            <Flex style={styles.rankingScoreRow}>
                <Image style={styles.avatarIcon} tintColor="#053A93" source={require('@/assets/images/user/img1.png')} />
                <Text style={[styles.avatarValue, scoreColor ? { color: scoreColor } : null]}>{formatScore(score)}</Text>
            </Flex>
        </Flex>
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
    const listItems = useMemo(() => rankingList.slice(0, 10), [rankingList]);

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
          : DEFAULT_AVATAR;

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
                <Flex justify="between" style={styles.rankingBpx}>
                    {PODIUM_ORDER.map((rankIndex, displayIndex) => (
                        <PodiumItem
                            key={rankIndex}
                            item={topThree[rankIndex]}
                            frameSource={PODIUM_FRAMES[displayIndex]}
                            marginTop={displayIndex === 1 ? undefined : 20}
                            scoreColor={displayIndex === 1 ? '#053A93' : '#053A93'}
                        />
                    ))}
                </Flex>

                {listItems.length === 0 ? (
                    <View style={[styles.center, { marginTop: 24 }]}>
                        <Text style={styles.rankingItemText2}>暂无排行榜数据</Text>
                    </View>
                ) : (
                    listItems.map(item => (
                        <RankingRow
                            key={String(item.id ?? `${item.userId}-${item.sort}`)}
                            rankLabel={String(item.sort ?? '-')}
                            name={item.nickName?.trim() || '用户'}
                            streak={formatStreak(item.continuousDays)}
                            score={item.tokens ?? 0}
                            avatarSource={resolveAvatarSource(item.avatar)}
                        />
                    ))
                )}
            </ScrollView>

            <View style={styles.rankingMeBar}>
                <Flex style={styles.rankingMeItemBox}>
                    <Text style={styles.numBox}>{myRankLabel}</Text>
                    <Image source={myAvatarSource} style={styles.listImg} />
                    <View style={styles.rankingListInfo}>
                        <Text style={styles.rankingItemText}>{myName}</Text>
                        <Text style={styles.rankingItemText2}>{myStreak}</Text>
                    </View>
                    <Flex style={styles.rankingScoreRow}>
                        <Image
                            style={[styles.avatarIcon, { width: 26, height: 26 }]}
                            tintColor="#333"
                            source={require('@/assets/images/user/img1.png')}
                        />
                        <Text style={[styles.avatarValue, { color: '#333', fontSize: 18 }]}>{formatScore(myScore)}</Text>
                    </Flex>
                </Flex>
            </View>
        </View>
    );
}

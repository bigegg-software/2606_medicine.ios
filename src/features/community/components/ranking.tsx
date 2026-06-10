import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/community/community';

type RankingRowProps = {
    rankLabel: string;
    name: string;
    streak: string;
    score: number;
    rankLabelStyle?: object;
};

function RankingRow({ rankLabel, name, streak, score, rankLabelStyle }: RankingRowProps) {
    return (
        <Flex style={styles.rankingItemBox}>
            <Text style={[styles.numBox, rankLabelStyle]}>{rankLabel}</Text>
            <Image source={require('@/assets/images/home/head.png')} style={styles.listImg} />
            <View style={styles.rankingListInfo}>
                <Text style={styles.rankingItemText}>{name}</Text>
                <Text style={styles.rankingItemText2}>{streak}</Text>
            </View>
            <Flex style={styles.rankingScoreRow}>
                <Image style={styles.avatarIcon} tintColor="#333" source={require('@/assets/images/user/img1.png')} />
                <Text style={[styles.avatarValue, { color: '#333' }]}>{score}</Text>
            </Flex>
        </Flex>
    );
}

const MY_RANKING = {
    rankLabel: '我',
    name: '张大爷',
    streak: '连续4天',
    score: 3211,
};

export default function RankingPage() {
    return (
        <View style={styles.rankingPage}>
            <ScrollView
                style={styles.rankingScroll}
                contentContainerStyle={styles.rankingScrollContent}
                showsVerticalScrollIndicator={false}>
                <Flex justify="between" style={styles.rankingBpx}>
                    <Flex direction="column" style={[styles.rankingItem, { marginTop: 20 }]}>
                        <Flex style={styles.headImgBox}>
                            <Image source={require('@/assets/images/home/head.png')} style={styles.headImg} />
                            <Image style={styles.headBg} source={require('@/assets/images/community/image2.png')} />
                        </Flex>
                        <Text style={styles.rankingItemText}>张大爷</Text>
                        <Flex style={styles.rankingScoreRow}>
                            <Image style={styles.avatarIcon} tintColor="#053A93" source={require('@/assets/images/user/img1.png')} />
                            <Text style={styles.avatarValue}>3211</Text>
                        </Flex>
                    </Flex>
                    <Flex direction="column" style={styles.rankingItem}>
                        <Flex style={styles.headImgBox}>
                            <Image source={require('@/assets/images/home/head.png')} style={styles.headImg} />
                            <Image style={styles.headBg} source={require('@/assets/images/community/image1.png')} />
                        </Flex>
                        <Text style={styles.rankingItemText}>张大爷</Text>
                        <Flex style={styles.rankingScoreRow}>
                            <Image style={styles.avatarIcon} tintColor="#053A93" source={require('@/assets/images/user/img1.png')} />
                            <Text style={[styles.avatarValue, { color: '#053A93' }]}>{3211}</Text>
                        </Flex>
                    </Flex>
                    <Flex direction="column" style={[styles.rankingItem, { marginTop: 20 }]}>
                        <Flex style={styles.headImgBox}>
                            <Image source={require('@/assets/images/home/head.png')} style={styles.headImg} />
                            <Image style={styles.headBg} source={require('@/assets/images/community/image3.png')} />
                        </Flex>
                        <Text style={styles.rankingItemText}>张大爷</Text>
                        <Flex style={styles.rankingScoreRow}>
                            <Image style={styles.avatarIcon} tintColor="#053A93" source={require('@/assets/images/user/img1.png')} />
                            <Text style={[styles.avatarValue, { color: '#053A93' }]}>{3211}</Text>
                        </Flex>
                    </Flex>
                </Flex>
                <RankingRow rankLabel="1" name="张大爷" streak="连续4天" score={3211} />
                <RankingRow rankLabel="2" name="李阿姨" streak="连续3天" score={2980} />
                <RankingRow rankLabel="3" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="4" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="5" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="6" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="7" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="8" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="9" name="王叔叔" streak="连续3天" score={2756} />
                <RankingRow rankLabel="10" name="王叔叔" streak="连续3天" score={2756} />
            </ScrollView>
            <View style={styles.rankingMeBar}>
                <Flex style={styles.rankingMeItemBox}>
                    <Text style={styles.numBox}>12</Text>
                    <Image source={require('@/assets/images/home/head.png')} style={styles.listImg} />
                    <View style={styles.rankingListInfo}>
                        <Text style={styles.rankingItemText}>{MY_RANKING.name}</Text>
                        <Text style={styles.rankingItemText2}>{MY_RANKING.streak}</Text>
                    </View>
                    <Flex style={styles.rankingScoreRow}>
                        <Image style={[styles.avatarIcon, { width: 26, height: 26 }]} tintColor="#333" source={require('@/assets/images/user/img1.png')} />
                        <Text style={[styles.avatarValue, { color: '#333', fontSize: 18 }]}>{MY_RANKING.score}</Text>
                    </Flex>
                </Flex>
            </View>
        </View>
    );
}

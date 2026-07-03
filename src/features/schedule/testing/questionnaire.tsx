import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ScrollView, Image, View, Text, TouchableOpacity } from 'react-native';
import Svg, { Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/schedule/testingPage';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/route/router';
import type { UserQuestionRecord } from '@/api/questionTemplate';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { useQuestionnaireGoalDetail } from './useQuestionnaireGoalDetail';
import { useQuestionnaireRecords } from './useQuestionnaireRecords';
import {
    formatRecordDate,
} from './testingHelpers';
import {
    formatEq5dSelfHealthScore,
    formatQuestionnaireScoreLevel,
    getQuestionnaireBestTarget,
    getQuestionnaireImproveLabel,
    getQuestionnaireScoreLevel,
    getQuestionnaireStatusColors,
    getQuestionnaireTierProgress,
    hasQuestionnaireScoreImproved,
    parseEq5dSelfHealthScore,
    QUESTIONNAIRE_CONFIG,
} from './questionnaireHelpers';

const TESTING_HEADER_BG = require('@/assets/images/schedule/pageBack.png');
const GAUGE_WIDTH = 150;
const GAUGE_HEIGHT = 75;
const GAUGE_STROKE = 8;
const GAUGE_CENTER_X = GAUGE_WIDTH / 2;
const GAUGE_CENTER_Y = GAUGE_HEIGHT - GAUGE_STROKE / 2;
const GAUGE_RADIUS = GAUGE_HEIGHT - GAUGE_STROKE;
const GAUGE_DOT_SIZE = 30;
const GAUGE_DOT_PADDING = GAUGE_DOT_SIZE / 2;
const GAUGE_SVG_WIDTH = GAUGE_WIDTH + GAUGE_DOT_PADDING * 2;
const GAUGE_SVG_HEIGHT = GAUGE_HEIGHT + GAUGE_DOT_PADDING * 2;
const GAUGE_SVG_CENTER_X = GAUGE_CENTER_X + GAUGE_DOT_PADDING;
const GAUGE_SVG_CENTER_Y = GAUGE_CENTER_Y + GAUGE_DOT_PADDING;
const TOP_CENTER_ASPECT = 222 / 440;
const GAUGE_INNER_ARC_GAP = GAUGE_STROKE;
const GAUGE_INNER_ARC_RADIUS =
    GAUGE_RADIUS - GAUGE_STROKE / 2 - GAUGE_INNER_ARC_GAP - GAUGE_STROKE / 2;
const GAUGE_INNER_ARC_WIDTH = GAUGE_INNER_ARC_RADIUS * 2;
const GAUGE_INNER_ARC_HEIGHT = GAUGE_INNER_ARC_WIDTH * TOP_CENTER_ASPECT;
const PG_INDICATOR_WIDTH = 33;
const PG_SCORE_COLOR_LOW = '#C2C2C2';
const PG_SCORE_COLOR_MID = '#72A1C5';
const PG_SCORE_COLOR_HIGH = '#6D925E';

function getSelfHealthScoreColor(score: number) {
    if (score < 100 / 3) return PG_SCORE_COLOR_LOW;
    if (score < (100 * 2) / 3) return PG_SCORE_COLOR_MID;
    return PG_SCORE_COLOR_HIGH;
}

function clampScore(score?: number | null) {
    if (score == null || Number.isNaN(Number(score))) return null;
    return Math.min(100, Math.max(0, Number(score)));
}

function SelfHealthScoreIndicator({ score, barWidth }: { score: number; barWidth: number }) {
    const indicatorLeft = useMemo(() => {
        if (barWidth <= 0) return 0;
        const centerX = (score / 100) * barWidth;
        return Math.min(
            barWidth - PG_INDICATOR_WIDTH,
            Math.max(0, centerX - PG_INDICATOR_WIDTH / 2),
        );
    }, [barWidth, score]);

    const indicatorColor = getSelfHealthScoreColor(score);
    const indicatorTextColor = indicatorColor === PG_SCORE_COLOR_LOW ? '#333333' : '#FFFFFF';

    return (
        <View style={[styles.pgIndicatorWrap, { left: indicatorLeft }]}>
            <View style={[styles.pgIndicatorBox, { backgroundColor: indicatorColor }]}>
                <Text style={[styles.pgIndicatorText, { color: indicatorTextColor }]}>
                    {Math.round(score)}
                </Text>
            </View>
            <View style={[styles.pgIndicatorTriangle, { borderTopColor: indicatorColor }]} />
        </View>
    );
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad),
    };
}

function describeArc(
    cx: number,
    cy: number,
    radius: number,
    startAngleDeg: number,
    sweepAngleDeg: number,
) {
    const start = polarToCartesian(cx, cy, radius, startAngleDeg);
    const end = polarToCartesian(cx, cy, radius, startAngleDeg + sweepAngleDeg);
    const largeArcFlag = Math.abs(sweepAngleDeg) > 180 ? 1 : 0;
    const sweepFlag = sweepAngleDeg >= 0 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

export default function QuestionnaireTestingPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'QuestionnaireTestingPage'>>();
    const insets = useSafeAreaInsets();
    const healthGoalId = route.params?.id;
    const userId = useSelector(
        (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
    );
    const { questionnaireType, title: goalTitle } = useQuestionnaireGoalDetail(healthGoalId);
    const {
        records,
        latestTwoRecords,
        reload: reloadRecords,
    } = useQuestionnaireRecords({
        healthGoalId,
        questionnaireType,
        userId,
    });
    const testName = goalTitle;
    const estimatedTime = useMemo(() => {
        if (questionnaireType == null) return '约2分钟';
        return QUESTIONNAIRE_CONFIG.find(item => item.type === questionnaireType)?.duration || '约2分钟';
    }, [questionnaireType]);
    const firstRecord = records?.firstRecord;
    const latestRecord = records?.latestRecord;
    const bestTarget = useMemo(
        () => (questionnaireType != null ? getQuestionnaireBestTarget(questionnaireType) : null),
        [questionnaireType],
    );
    const [colorBarWidth, setColorBarWidth] = useState(0);
    const selfHealthScore = useMemo(() => {
        if (questionnaireType !== 3) return null;
        return clampScore(parseEq5dSelfHealthScore(latestRecord));
    }, [latestRecord, questionnaireType]);
    const improveLabel = useMemo(
        () => (questionnaireType != null
            ? getQuestionnaireImproveLabel(questionnaireType, latestRecord, firstRecord)
            : '等待评估'),
        [firstRecord, latestRecord, questionnaireType],
    );
    const initialLevel = questionnaireType != null
        ? formatQuestionnaireScoreLevel(questionnaireType, firstRecord?.score)
        : '--';
    const currentLevel = questionnaireType != null
        ? formatQuestionnaireScoreLevel(questionnaireType, latestRecord?.score)
        : '--';
    const tierProgress = useMemo(() => {
        if (questionnaireType == null) return null;
        return getQuestionnaireTierProgress(questionnaireType, latestRecord?.score);
    }, [latestRecord?.score, questionnaireType]);
    const targetLevel = bestTarget?.label ?? '--';
    const gradientId = useId().replace(/:/g, '');
    const progress = tierProgress ?? 0;

    const trackPath = useMemo(
        () => describeArc(GAUGE_SVG_CENTER_X, GAUGE_SVG_CENTER_Y, GAUGE_RADIUS, 180, 180),
        [],
    );

    const arcLength = Math.PI * GAUGE_RADIUS;
    const progressSweep = (180 * progress) / 100;
    const progressDash = useMemo(() => {
        if (progress <= 0) return `0 ${arcLength}`;
        const visible = (arcLength * progress) / 100;
        return `${visible} ${arcLength}`;
    }, [arcLength, progress]);

    const arcStartPoint = useMemo(
        () => polarToCartesian(GAUGE_SVG_CENTER_X, GAUGE_SVG_CENTER_Y, GAUGE_RADIUS, 180),
        [],
    );
    const arcFadeEndPoint = useMemo(
        () => polarToCartesian(GAUGE_SVG_CENTER_X, GAUGE_SVG_CENTER_Y, GAUGE_RADIUS, 180 + 180 * 0.9),
        [],
    );

    const dotPosition = useMemo(() => {
        const angle = 180 + progressSweep;
        return polarToCartesian(GAUGE_SVG_CENTER_X, GAUGE_SVG_CENTER_Y, GAUGE_RADIUS, angle);
    }, [progressSweep]);

    useEffect(() => {
        navigation.setOptions({
            title: testName,
        });
    }, [navigation, testName]);

    useFocusEffect(
        useCallback(() => {
            reloadRecords();
        }, [reloadRecords]),
    );

    const navigateToQuestionnaire = useCallback(() => {
        if (questionnaireType == null) return;
        navigation.navigate('QuestionnairePage', { type: questionnaireType });
    }, [navigation, questionnaireType]);

    const navigateToRecordList = useCallback(() => {
        if (questionnaireType == null) return;
        navigation.navigate('QuestionnaireTestingRecordPage', {
            questionnaireType,
            title: testName,
        });
    }, [navigation, questionnaireType, testName]);

    const navigateToDetail = useCallback((record: UserQuestionRecord) => {
        if (record.id == null) return;
        navigation.navigate('QuestionnaireDetail', { id: String(record.id) });
    }, [navigation]);

    return (
        <PageLayout style={styles.container} headerBackSource={TESTING_HEADER_BG} edges={[]}>
            <View style={styles.page}>
                <ScrollView style={styles.body} contentContainerStyle={styles.scroll}>
                    <View style={styles.rowBox}>
                        <Flex style={styles.rightBox}>
                            <Image style={styles.rightImg} source={require('@/assets/images/schedule/leftImg.png')} />
                            <Image style={styles.rightTime} source={require('@/assets/images/schedule/rightTime.png')} />
                            <Text style={styles.rightText}>{estimatedTime}</Text>
                        </Flex>

                        <View>
                            <Text style={styles.rowTitle}>{testName}</Text>
                            <Flex style={{ marginTop: 6 }}>
                                <Text style={styles.rowText}>{improveLabel}</Text>
                                {questionnaireType != null && hasQuestionnaireScoreImproved(questionnaireType, latestRecord, firstRecord) ? (
                                    <Image style={styles.rowImg} source={require('@/assets/images/schedule/up.png')} />
                                ) : null}
                            </Flex>
                        </View>

                        <Flex align="end" style={styles.gaugeBox}>
                            <Flex direction="column" style={styles.gaugeTitleBox}>
                                <Text style={styles.gaugeValue}>{initialLevel}</Text>
                                <Text style={styles.gaugeText}>初始</Text>
                            </Flex>

                            <View style={styles.gaugeWrap}>
                                <Svg
                                    width={GAUGE_SVG_WIDTH}
                                    height={GAUGE_SVG_HEIGHT}
                                    viewBox={`0 0 ${GAUGE_SVG_WIDTH} ${GAUGE_SVG_HEIGHT}`}
                                    style={{
                                        position: 'absolute',
                                        left: -GAUGE_DOT_PADDING,
                                        top: -GAUGE_DOT_PADDING,
                                    }}>
                                    <Defs>
                                        <LinearGradient
                                            id={gradientId}
                                            x1={arcStartPoint.x}
                                            y1={arcStartPoint.y}
                                            x2={arcFadeEndPoint.x}
                                            y2={arcFadeEndPoint.y}
                                            gradientUnits="userSpaceOnUse">
                                            <Stop offset="0" stopColor="#6D925E" stopOpacity={1} />
                                            <Stop offset={0.5167 / 0.9} stopColor="#6D925E" stopOpacity={1} />
                                            <Stop offset="1" stopColor="#e2f5c3" stopOpacity={1} />
                                        </LinearGradient>
                                    </Defs>
                                    <Path
                                        d={trackPath}
                                        stroke="#ecf3ff"
                                        strokeWidth={GAUGE_STROKE}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {progress > 0 ? (
                                        <Path
                                            d={trackPath}
                                            stroke={`url(#${gradientId})`}
                                            strokeWidth={GAUGE_STROKE}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeDasharray={progressDash}
                                        />
                                    ) : null}
                                    {progress > 0 ? (
                                        <SvgImage
                                            x={dotPosition.x - GAUGE_DOT_SIZE / 2}
                                            y={dotPosition.y - GAUGE_DOT_SIZE / 2}
                                            width={GAUGE_DOT_SIZE}
                                            height={GAUGE_DOT_SIZE}
                                            preserveAspectRatio="xMidYMid meet"
                                            href={require('@/assets/images/schedule/bor.png')}
                                        />
                                    ) : null}
                                </Svg>
                                <View style={[styles.gaugeTopCenter, { bottom: GAUGE_STROKE / 2 }]}>
                                    <Image
                                        style={{
                                            width: GAUGE_INNER_ARC_WIDTH,
                                            height: GAUGE_INNER_ARC_HEIGHT,
                                        }}
                                        source={require('@/assets/images/schedule/topCenter.png')}
                                    />
                                    <View style={styles.gaugeTopCenterBox}>
                                        <Text style={styles.gaugeTopCenterValue}>{currentLevel}</Text>
                                        <Text style={styles.gaugeTopCenterText}>当前健康指数测评</Text>
                                    </View>
                                </View>
                            </View>
                            <Flex direction="column" style={styles.gaugeTitleBox}>
                                <Text style={styles.gaugeValue}>{targetLevel}</Text>
                                <Text style={styles.gaugeText}>目标</Text>
                            </Flex>
                        </Flex>
                        {questionnaireType === 3 ? (
                        <Flex align="start" style={styles.pgBox}>
                            <Text style={styles.pgText}>自我健康评分</Text>

                            <View
                                style={styles.pgColorBarContainer}
                                onLayout={event => setColorBarWidth(event.nativeEvent.layout.width)}>
                                <View style={styles.pgIndicatorArea}>
                                    {selfHealthScore != null && colorBarWidth > 0 ? (
                                        <SelfHealthScoreIndicator score={selfHealthScore} barWidth={colorBarWidth} />
                                    ) : null}
                                </View>
                                <Flex style={styles.pgColorBarRow}>
                                    <View style={styles.pgColorBarSegment}>
                                        <View style={styles.pgColorBarFirst} />
                                    </View>
                                    <View style={styles.pgColorBarSegment}>
                                        <View style={styles.pgColorBarSecond} />
                                    </View>
                                    <View style={styles.pgColorBarSegment}>
                                        <View style={styles.pgColorBarThird} />
                                    </View>
                                </Flex>
                                <Flex style={styles.pgBarLabelsRow}>
                                    <Text style={[styles.pgBarText, styles.pgColorBarSegment]}>0</Text>
                                    <Text style={[styles.pgBarText, styles.pgColorBarSegment]}>50</Text>
                                    <Text style={[styles.pgBarText, styles.pgColorBarSegment]}>100</Text>
                                </Flex>
                            </View>
                        </Flex>
                        ) : null}
                    </View>
                    <View style={styles.infoBox}>
                        <Flex justify='between'>
                            <Text style={styles.infoTitle}>评估记录</Text>
                            <TouchableOpacity onPress={navigateToRecordList}>
                                <Flex>
                                    <Text style={styles.infoAllText}>全部</Text>
                                </Flex>
                            </TouchableOpacity>
                        </Flex>
                        <View style={styles.infoRecordBox}>
                            {latestTwoRecords.length > 0 && questionnaireType != null ? (
                                latestTwoRecords.map((record, index) => {
                                    const scoreLevel = getQuestionnaireScoreLevel(questionnaireType, record.score);
                                    const statusColors = getQuestionnaireStatusColors(scoreLevel);
                                    return (
                                        <TouchableOpacity
                                            key={String(record.id ?? record.createTime ?? index)}
                                            activeOpacity={0.7}
                                            disabled={record.id == null}
                                            onPress={() => navigateToDetail(record)}>
                                        <Flex
                                            justify='between'
                                            align='start'
                                            style={[
                                                styles.infoRecordItem,
                                                { paddingVertical: 12 },
                                                index > 0 ? { marginTop: 12 } : null,
                                            ]}>
                                            <Flex>
                                                <Image
                                                    style={styles.infoRecordImg}
                                                    source={require('@/assets/images/schedule/order.png')}
                                                />
                                                <View>
                                                    <Text style={styles.infoRecordText}>健康指数测评</Text>
                                                    {questionnaireType === 3 ? (
                                                        <Text style={[styles.infoRecordTime, { marginTop: 6 }]}>
                                                            自我健康评分:{formatEq5dSelfHealthScore(record)}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </Flex>
                                            <Flex direction="column" align="end">
                                                <Flex style={[
                                                    styles.infoRecordStatus,
                                                    { borderColor: statusColors.text, alignSelf: 'flex-end' },
                                                ]}>
                                                    <Text style={[
                                                        styles.infoRecordStatusText,
                                                        { color: statusColors.text },
                                                    ]}>
                                                        {scoreLevel?.result ?? '--'}
                                                    </Text>
                                                </Flex>
                                                <Text style={[styles.infoRecordTime, { marginTop: 6, textAlign: 'right' }]}>
                                                    {formatRecordDate(record.createTime)}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <Text style={styles.infoItemText}>暂无评估记录</Text>
                                </Flex>
                            )}
                        </View>
                    </View>
                </ScrollView>
                <Flex
                    justify='between'
                    style={[
                        styles.bottomBar,
                        { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.bottomBarButtonLeft, { flex: 1 }]}
                        disabled={questionnaireType == null}
                        onPress={navigateToQuestionnaire}>
                        <Flex justify='center' style={{ flex: 1 }} >
                            <Image style={styles.bottomBarButtonImg} source={require('@/assets/images/schedule/pg.png')} />
                            <Text style={styles.bottomBarButtonTextLeft}>立即评估</Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </View>
        </PageLayout>
    );
}

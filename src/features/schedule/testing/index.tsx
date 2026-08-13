import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ScrollView, Image, View, Text, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import Svg, { Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import PageLayout from '@/src/components/PageLayout';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import { Flex, Toast } from '@ant-design/react-native';
import styles from '@/css/schedule/testingPage';
import recordModalStyles from '@/css/schedule/results';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/route/router';
import { splitMultilineText } from '@/src/features/schedule/playerHelpers';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { useHealthTestDetailByGoalId } from './useHealthTestDetail';
import { useHealthTestRecords } from './useHealthTestRecords';
import { addExHealthTestRecord } from '@/api/exHealthTestRecord';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    calcGaugeProgress,
    calcJointRomAverage,
    createEmptyJointRomInputs,
    buildJointRomDisplayItems,
    formatGaugeValue,
    formatChangeVsPrevious,
    formatRecordDate,
    formatTestValue,
    getImproveLabel,
    hasTestTimer,
    isJointRomHealthTest,
    JOINT_ROM_FIELDS,
    parseJointRomInputs,
    resolveHealthTestGaugeValues,
    resolveHealthTestUnit,
    resolveRecordTrendTone,
    hasJointRomObjValue,
    type JointRomInputMap,
    type JointRomObjValue,
} from './testingHelpers';
import StepTimeline from '../components/StepTimeline';
import JointRomRecordValues from './JointRomRecordValues';

const TESTING_HEADER_BG = require('@/assets/images/schedule/pageBack.png');
const TREND_ICON = require('@/assets/images/schedule/icon_trend_up.png');
const TREND_COLOR_UP = '#6D925E';
const TREND_COLOR_DOWN = '#E85D4C';
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

const DEFAULT_TEST_STEPS = [
    '坐在椅子上，双脚平放在地面上，双手放在膝盖上。',
    '保持背部挺直，膝盖弯曲90度，脚尖着地。',
];

export default function TestingPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'TestingPage'>>();
    const insets = useSafeAreaInsets();
    const healthGoalId = route.params?.id;
    const userId = useSelector(
        (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
    );
    const { detail, healthTestItemId, goalTarget } = useHealthTestDetailByGoalId(healthGoalId);
    const {
        records,
        recordTotal,
        latestTwoRecords,
        exPatientRuleId,
        configuredBaseline,
        configuredTarget,
        improveDirectionVal,
        reload: reloadRecords,
    } = useHealthTestRecords({
        healthGoalId,
        healthTestItemId,
        userId,
    });
    const [recordInput, setRecordInput] = useState('');
    const [jointRomInputs, setJointRomInputs] = useState<JointRomInputMap>(createEmptyJointRomInputs);
    const [recordModalVisible, setRecordModalVisible] = useState(false);
    const [recordInputSession, setRecordInputSession] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const recordInputRef = useRef<TextInput>(null);
    const isJointRom = useMemo(
        () => isJointRomHealthTest({
            testName: detail?.testName,
            resultRecord: detail?.resultRecord,
            hasJointRomTarget: Boolean(goalTarget?.jointRom),
        }),
        [detail?.resultRecord, detail?.testName, goalTarget?.jointRom],
    );
    const unit = resolveHealthTestUnit(detail);
    const firstRecord = records?.firstRecord;
    const latestRecord = records?.latestRecord;
    const latestValue = latestRecord?.testValue;
    const hasMultipleRecords = recordTotal >= 2
        || (
            firstRecord?.id != null
            && latestRecord?.id != null
            && String(firstRecord.id) !== String(latestRecord.id)
        );
    const { baseline: firstValue, target: targetValue } = useMemo(
        () => resolveHealthTestGaugeValues({
            configuredBaseline,
            configuredTarget,
            firstRecordValue: firstRecord?.testValue,
            improveDirectionVal,
            improveDirection: detail?.improveDirection,
        }),
        [
            configuredBaseline,
            configuredTarget,
            detail?.improveDirection,
            firstRecord?.testValue,
            improveDirectionVal,
        ],
    );
    const jointRomItems = useMemo(
        () => (isJointRom
            ? buildJointRomDisplayItems({
                jointRomTarget: goalTarget?.jointRom,
                firstObjValue: firstRecord?.objValue,
                latestObjValue: latestRecord?.objValue,
                previousObjValue: latestTwoRecords[1]?.objValue,
                improveDirectionVal,
                improveDirection: detail?.improveDirection,
                hasMultipleRecords,
            })
            : []),
        [
            detail?.improveDirection,
            firstRecord?.objValue,
            goalTarget?.jointRom,
            hasMultipleRecords,
            improveDirectionVal,
            isJointRom,
            latestRecord?.objValue,
            latestTwoRecords,
        ],
    );
    const testName = detail?.testName?.trim() || '坐站测试';
    const testSteps = useMemo(() => {
        const steps = splitMultilineText(detail?.testSteps);
        return steps.length > 0 ? steps : DEFAULT_TEST_STEPS;
    }, [detail?.testSteps]);
    const precautionLines = useMemo(
        () => splitMultilineText(detail?.precautions),
        [detail?.precautions],
    );
    const firstJointRomItem = isJointRom ? jointRomItems[0] : undefined;
    const restJointRomItems = isJointRom ? jointRomItems.slice(1) : [];
    const cardTitle = firstJointRomItem?.label || testName;
    const firstJointRomChange = useMemo(() => (
        firstJointRomItem
            ? formatChangeVsPrevious({
                current: firstJointRomItem.current,
                previous: firstJointRomItem.previous,
                unit,
            })
            : null
    ), [firstJointRomItem, unit]);
    /** 普通测试：标题旁变化量相对「当前 vs 上次」评估值，无当前评估时不展示 */
    const healthTestChange = useMemo(() => {
        if (isJointRom) return null;
        return formatChangeVsPrevious({
            current: latestValue,
            previous: latestTwoRecords[1]?.testValue ?? null,
            unit,
        });
    }, [isJointRom, latestTwoRecords, latestValue, unit]);
    const titleChange = isJointRom ? firstJointRomChange : healthTestChange;
    // 有相对当前值的变化数据时才展示方向徽标
    const showImproveBadge = Boolean(detail) && titleChange != null;
    const gaugeFirstValue = firstJointRomItem?.baseline ?? firstValue;
    const gaugeLatestValue = firstJointRomItem?.current ?? latestValue;
    const gaugeTargetValue = firstJointRomItem?.target ?? targetValue;
    const gradientId = useId().replace(/:/g, '');
    const progress = useMemo(
        () => calcGaugeProgress(gaugeFirstValue, gaugeLatestValue, gaugeTargetValue),
        [gaugeFirstValue, gaugeLatestValue, gaugeTargetValue],
    );
    const showTimerActions = hasTestTimer(detail?.timerType);

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

    const navigateToResults = useCallback(() => {
        if (healthTestItemId == null) return;
        navigation.navigate('TestingResultsPage', {
            healthTestItemId: String(healthTestItemId),
        });
    }, [healthTestItemId, navigation]);

    const canSubmitRecord = useMemo(() => {
        if (isJointRom) {
            return parseJointRomInputs(jointRomInputs) != null;
        }
        const testValue = Number(recordInput);
        return recordInput.trim() !== '' && !Number.isNaN(testValue) && testValue >= 0;
    }, [isJointRom, jointRomInputs, recordInput]);

    const openRecordModal = useCallback(() => {
        Keyboard.dismiss();
        setRecordInput('');
        setJointRomInputs(createEmptyJointRomInputs());
        setRecordInputSession(prev => prev + 1);
        setRecordModalVisible(true);
    }, []);

    const closeRecordModal = useCallback(() => {
        Keyboard.dismiss();
        setRecordModalVisible(false);
        setRecordInput('');
        setJointRomInputs(createEmptyJointRomInputs());
    }, []);

    useEffect(() => {
        if (!recordModalVisible || isJointRom) return;
        const timer = setTimeout(() => {
            recordInputRef.current?.focus();
        }, 320);
        return () => clearTimeout(timer);
    }, [isJointRom, recordInputSession, recordModalVisible]);

    const submitRecord = useCallback(async (payload: {
        testValue?: number;
        objValue?: JointRomObjValue;
    }) => {
        if (!exPatientRuleId || healthTestItemId == null) {
            Toast.show('缺少处方信息，无法保存');
            return false;
        }

        setSubmitting(true);
        try {
            const res = await addExHealthTestRecord({
                exPatientRuleId: String(exPatientRuleId),
                healthTestItemId: String(healthTestItemId),
                ...(payload.testValue != null ? { testValue: payload.testValue } : {}),
                ...(payload.objValue ? { objValue: payload.objValue } : {}),
            });
            if (isResourceApiOk(res)) {
                Toast.success('记录成功');
                closeRecordModal();
                reloadRecords();
                return true;
            }
            Toast.show((res as { msg?: string })?.msg || '保存失败');
            setRecordModalVisible(true);
            return false;
        } catch {
            Toast.show('保存失败');
            setRecordModalVisible(true);
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [closeRecordModal, exPatientRuleId, healthTestItemId, reloadRecords]);

    const handleConfirmRecord = useCallback(() => {
        if (!canSubmitRecord || submitting) return;
        if (isJointRom) {
            const objValue = parseJointRomInputs(jointRomInputs);
            if (!objValue) return;
            const average = calcJointRomAverage(objValue);
            void submitRecord({
                testValue: average ?? undefined,
                objValue,
            });
            return;
        }
        void submitRecord({ testValue: Number(recordInput) });
    }, [canSubmitRecord, isJointRom, jointRomInputs, recordInput, submitRecord, submitting]);

    const updateJointRomInput = useCallback((key: keyof JointRomInputMap, value: string) => {
        setJointRomInputs(prev => ({ ...prev, [key]: value }));
    }, []);

    const renderJointRomImproveBadge = useCallback((item: (typeof jointRomItems)[number]) => {
        const change = formatChangeVsPrevious({
            current: item.current,
            previous: item.previous,
            unit,
        });
        if (!change) return null;
        return (
            <Flex align="center" style={{ marginLeft: 8, flexShrink: 0 }}>
                <Image
                    style={[styles.rowImg, !change.isRise && styles.rowImgDown]}
                    source={TREND_ICON}
                    tintColor={change.isRise ? TREND_COLOR_UP : TREND_COLOR_DOWN}
                />
                {change.amountText ? (
                    <Text style={[styles.rowText, !change.isRise && styles.rowTextDown]}>
                        {change.amountText}
                    </Text>
                ) : null}
            </Flex>
        );
    }, [unit]);

    const renderJointRomItem = useCallback((item: (typeof jointRomItems)[number]) => (
        <>
            <Flex justify="between" align="center">
                <Flex align="center" style={styles.jointRomTitleWrap}>
                    <Text style={styles.jointRomTitle} numberOfLines={1}>{item.label}</Text>
                    {renderJointRomImproveBadge(item)}
                </Flex>
                <Flex align="center" style={[
                    styles.jointRomStatus,
                    item.statusTone === 'warn' && styles.jointRomStatusWarn,
                    item.statusTone === 'muted' && styles.jointRomStatusMuted,
                ]}>
                    {item.statusTone !== 'muted' ? (
                        <Image
                            style={styles.gaugeUpImg}
                            source={require('@/assets/images/schedule/icon_up.png')}
                        />
                    ) : null}
                    <Text style={[
                        styles.jointRomStatusText,
                        item.statusTone !== 'muted' ? { marginLeft: 4 } : null,
                        item.statusTone === 'warn' && styles.jointRomStatusTextWarn,
                        item.statusTone === 'muted' && styles.jointRomStatusTextMuted,
                    ]}>
                        {item.statusText}
                    </Text>
                </Flex>
            </Flex>
            <Flex style={styles.jointRomMetrics}>
                <View style={styles.jointRomMetricBox}>
                    <Text style={styles.jointRomMetricValue}>
                        {formatGaugeValue(item.baseline)}
                    </Text>
                    <Text style={styles.jointRomMetricLabel}>初始({unit})</Text>
                </View>
                <View style={styles.jointRomMetricBox}>
                    <Text style={styles.jointRomMetricValue}>
                        {formatGaugeValue(item.current)}
                    </Text>
                    <Text style={styles.jointRomMetricLabel}>当前({unit})</Text>
                </View>
                <View style={styles.jointRomMetricBox}>
                    <Text style={styles.jointRomMetricValue}>
                        {formatGaugeValue(item.target)}
                    </Text>
                    <Text style={styles.jointRomMetricLabel}>目标({unit})</Text>
                </View>
            </Flex>
        </>
    ), [renderJointRomImproveBadge, unit]);

    return (
        <PageLayout
            style={styles.container}
            headerBackSource={TESTING_HEADER_BG}
            edges={[]}>
            <View style={styles.page}>
                <ScrollView style={styles.body} contentContainerStyle={styles.scroll}>
                    <View style={styles.rowBox}>
                        <Flex style={styles.rightBox}>
                            <Image style={styles.rightImg} source={require('@/assets/images/schedule/leftImg.png')} />
                            <Image style={styles.rightTime} source={require('@/assets/images/schedule/rightTime.png')} />
                            <Text style={styles.rightText}>{detail?.estimatedTime?.trim() || '约1分钟'}</Text>
                        </Flex>

                        <Flex align="center" style={{ paddingRight: 88 }}>
                            <Text style={[styles.rowTitle, { flexShrink: 1 }]}>{cardTitle}</Text>
                            {showImproveBadge ? (
                                <Flex align="center" style={{ marginLeft: 8, flexShrink: 0 }}>
                                    <Image
                                        style={[
                                            styles.rowImg,
                                            titleChange?.isRise === false && styles.rowImgDown,
                                        ]}
                                        source={TREND_ICON}
                                        tintColor={
                                            titleChange?.isRise !== false
                                                ? TREND_COLOR_UP
                                                : TREND_COLOR_DOWN
                                        }
                                    />
                                    {titleChange?.amountText ? (
                                        <Text
                                            style={[
                                                styles.rowText,
                                                titleChange?.isRise === false && styles.rowTextDown,
                                            ]}
                                        >
                                            {titleChange.amountText}
                                        </Text>
                                    ) : null}
                                </Flex>
                            ) : null}
                        </Flex>

                        <Flex align="end" style={styles.gaugeBox}>
                            <Flex direction="column" style={styles.gaugeTitleBox}>
                                <Text style={styles.gaugeValue}>{formatGaugeValue(gaugeFirstValue)}</Text>
                                <Text style={styles.gaugeText}>初始({unit})</Text>
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
                                        <Text style={styles.gaugeTopCenterValue}>{formatGaugeValue(gaugeLatestValue)}</Text>
                                        <Text style={styles.gaugeTopCenterText}>当前({unit})</Text>
                                    </View>
                                </View>
                            </View>
                            <Flex direction="column" style={styles.gaugeTitleBox}>
                                <Text style={styles.gaugeValue}>{formatGaugeValue(gaugeTargetValue)}</Text>
                                <Text style={styles.gaugeText}>目标({unit})</Text>
                            </Flex>
                        </Flex>
                        <Flex style={styles.gaugeUpBox}>
                            <Image style={styles.gaugeUpImg} source={require('@/assets/images/schedule/icon_up.png')} />
                            <Text style={styles.gaugeUpText}>
                                {firstJointRomItem
                                    ? firstJointRomItem.statusText
                                    : getImproveLabel(latestRecord?.firstChangePercent, {
                                        firstRecord,
                                        latestRecord,
                                        recordTotal,
                                    })}
                            </Text>
                        </Flex>
                    </View>

                    {restJointRomItems.map(item => (
                        <View key={item.key} style={styles.jointRomCard}>
                            {renderJointRomItem(item)}
                        </View>
                    ))}

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>测试说明</Text>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoItemText}>
                                {detail?.testDescription?.trim() || '暂无测试说明'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>测试步骤</Text>
                        <StepTimeline steps={testSteps} />
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>注意事项</Text>
                        <Flex justify='between' style={[styles.infoItem, { backgroundColor: "#FDF3E9" }]}>
                            <View>
                                {precautionLines.length > 0 ? precautionLines.map(line => (
                                    <Flex key={line}>
                                        <View style={styles.leftBor} />
                                        <Text style={styles.infoItemText}>{line}</Text>
                                    </Flex>
                                )) : (
                                    <Text style={styles.infoItemText}>暂无注意事项</Text>
                                )}
                            </View>
                            <Image style={styles.infoItemImg} source={require('@/assets/images/schedule/warn.png')}></Image>
                        </Flex>
                    </View>
                    <View style={styles.infoBox}>
                        <Flex justify='between'>
                            <Text style={styles.infoTitle}>测试记录</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TestingRecordPage', { healthTestItemId: String(healthTestItemId) })}>
                                <Flex>
                                    <Text style={styles.infoAllText}>全部</Text>
                                    <Image style={styles.infoAllImg} source={require('@/assets/images/schedule/right.png')}></Image>
                                </Flex>
                            </TouchableOpacity>
                        </Flex>
                        <View style={styles.infoRecordBox}>
                            {latestTwoRecords.length > 0 ? (
                                latestTwoRecords.map((record, index) => {
                                    const previousRecord = latestTwoRecords[index + 1];
                                    const showJointRomValues = isJointRom && hasJointRomObjValue(record.objValue);
                                    const tone = showJointRomValues
                                        ? null
                                        : resolveRecordTrendTone({
                                            currentValue: record.testValue,
                                            previousValue: previousRecord?.testValue,
                                            improveDirection: detail?.improveDirection,
                                        });

                                    if (showJointRomValues) {
                                        return (
                                            <JointRomRecordValues
                                                key={String(record.id ?? record.createTime ?? index)}
                                                title={testName || '关节活动度测量'}
                                                dateText={formatRecordDate(record.createTime)}
                                                objValue={record.objValue}
                                                previousObjValue={previousRecord?.objValue}
                                                unit={unit}
                                                improveDirection={detail?.improveDirection}
                                                compact
                                                style={index > 0 ? { marginTop: 12 } : undefined}
                                            />
                                        );
                                    }

                                    return (
                                        <View
                                            key={String(record.id ?? record.createTime ?? index)}
                                            style={[
                                                styles.infoRecordItem,
                                                { paddingVertical: 12 },
                                                index > 0 ? { marginTop: 12 } : null,
                                            ]}>
                                            <Flex justify="between" align="start">
                                                <Flex>
                                                    <Image
                                                        style={styles.infoRecordImg}
                                                        source={require('@/assets/images/schedule/rl.png')}
                                                    />
                                                    <View>
                                                        <Text style={styles.infoRecordText}>
                                                            {formatRecordDate(record.createTime)}
                                                        </Text>
                                                        <Flex style={[styles.infoRecordStatus, { marginTop: 6 }]}>
                                                            <Text style={styles.infoRecordStatusText}>
                                                                {getImproveLabel(record.firstChangePercent, {
                                                                    firstRecord,
                                                                    latestRecord: record,
                                                                })}
                                                            </Text>
                                                        </Flex>
                                                    </View>
                                                </Flex>
                                                <Flex>
                                                    {tone ? (
                                                        <Image
                                                            style={styles.infoRecordUpImg}
                                                            source={
                                                                tone === 'up'
                                                                    ? require('@/assets/images/schedule/icon_up.png')
                                                                    : require('@/assets/images/schedule/icon_down1.png')
                                                            }
                                                        />
                                                    ) : null}
                                                    <Text style={styles.infoRecordText}>
                                                        {formatTestValue(record.testValue, unit)}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </View>
                                    );
                                })
                            ) : (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <Text style={styles.infoItemText}>暂无测试记录</Text>
                                </Flex>
                            )}
                        </View>
                    </View>
                </ScrollView>
                {showTimerActions ? (
                    <Flex
                        justify='between'
                        style={[
                            styles.bottomBar,
                            { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.bottomBarButtonLeft}
                            disabled={healthTestItemId == null}
                            onPress={() => navigateToResults()}>
                            <Flex justify='center' style={{ flex: 1 }} >
                                <Image style={styles.bottomBarButtonImg} source={require('@/assets/images/schedule/icon_start.png')} />
                                <Text style={styles.bottomBarButtonTextLeft}>开始计时</Text>
                            </Flex>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.bottomBarButtonRight}
                            disabled={healthTestItemId == null}
                            onPress={openRecordModal}>
                            <Flex justify='center' style={{ flex: 1 }} >
                                <Image style={styles.bottomBarButtonImg} source={require('@/assets/images/schedule/icon_record.png')} />
                                <Text style={styles.bottomBarButtonTextRight}>记录结果</Text>
                            </Flex>
                        </TouchableOpacity>
                    </Flex>
                ) : (
                    <Flex
                        justify='between'
                        style={[
                            styles.bottomBar,
                            { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                        ]}
                    >
                        <TouchableOpacity
                            style={[styles.bottomBarButtonLeft, { flex: 1 }]}
                            disabled={healthTestItemId == null}
                            onPress={openRecordModal}>
                            <Flex justify='center' style={{ flex: 1 }} >
                                <Image tintColor="#FFFFFF" style={styles.bottomBarButtonImg} source={require('@/assets/images/schedule/icon_record.png')} />
                                <Text style={styles.bottomBarButtonTextLeft}>记录结果</Text>
                            </Flex>
                        </TouchableOpacity>
                    </Flex>
                )}
            </View>
            <BottomSheetModal
                visible={recordModalVisible}
                overlayOpacity={0.2}
                dismissOnBackdropPress={false}
                onClose={closeRecordModal}
                keyboardAccessory={<KeyboardDoneAccessory useOverlay />}
                sheetStyle={[recordModalStyles.recordModalBox, { paddingBottom: insets.bottom }]}>
                <View style={recordModalStyles.recordModalContent}>
                    <View style={recordModalStyles.recordModalHeader}>
                        <Text style={recordModalStyles.recordModalTitle}>记录测试结果</Text>
                        <TouchableOpacity
                            style={recordModalStyles.recordModalClose}
                            activeOpacity={0.7}
                            onPress={closeRecordModal}>
                            <Image
                                style={recordModalStyles.recordModalCloseIcon}
                                source={require('@/assets/images/schedule/close.png')}
                            />
                        </TouchableOpacity>
                    </View>

                    {isJointRom ? (
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 420 }}
                        >
                            {JOINT_ROM_FIELDS.map(field => (
                                <Flex
                                    key={field.key}
                                    align="center"
                                    style={recordModalStyles.inputWrap}
                                >
                                    <Text style={recordModalStyles.inputLabel}>{field.label}</Text>
                                    <TextInput
                                        key={`joint-${field.key}-${recordInputSession}`}
                                        style={recordModalStyles.recordModalInput}
                                        value={jointRomInputs[field.key]}
                                        onChangeText={text => updateJointRomInput(field.key, text)}
                                        keyboardType="decimal-pad"
                                        placeholder="请输入测试成绩"
                                        placeholderTextColor="#CCCCCC"
                                        underlineColorAndroid="transparent"
                                        textAlign="center"
                                    />
                                    <Text style={recordModalStyles.inputUnit}>{unit}</Text>
                                </Flex>
                            ))}
                        </ScrollView>
                    ) : (
                        <Flex align="center" style={recordModalStyles.inputWrap}>
                            <Text style={recordModalStyles.inputLabel}>测试结果</Text>
                            <TextInput
                                key={`record-${recordInputSession}`}
                                ref={recordInputRef}
                                style={recordModalStyles.recordModalInput}
                                value={recordInput}
                                onChangeText={setRecordInput}
                                keyboardType="number-pad"
                                placeholder="请输入测试成绩"
                                placeholderTextColor="#CCCCCC"
                                underlineColorAndroid="transparent"
                                textAlign="center"
                            />
                            <Text style={recordModalStyles.inputUnit}>{unit}</Text>
                        </Flex>
                    )}
                </View>
                <Flex style={recordModalStyles.btnBox}>
                    <TouchableOpacity
                        style={[
                            recordModalStyles.recordModalConfirm,
                            canSubmitRecord && !submitting && recordModalStyles.recordModalConfirmEnabled,
                        ]}
                        activeOpacity={0.7}
                        disabled={!canSubmitRecord || submitting}
                        onPress={handleConfirmRecord}>
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                style={recordModalStyles.bottomBarButtonImg}
                                source={require('@/assets/images/schedule/save.png')}
                            />
                            <Text style={recordModalStyles.bottomBarButtonText}>
                                {submitting ? '保存中...' : '保存记录'}
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </BottomSheetModal>
        </PageLayout>
    );
}

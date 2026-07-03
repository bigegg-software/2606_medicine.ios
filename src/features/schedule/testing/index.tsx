import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ScrollView, Image, View, Text, TouchableOpacity, TextInput } from 'react-native';
import Svg, { Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import PageLayout from '@/src/components/PageLayout';
import BottomSheetModal from '@/src/components/BottomSheetModal';
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
    calcTargetFromInitial,
    formatGaugeValue,
    formatRecordDate,
    formatTestValue,
    getImproveLabel,
} from './testingHelpers';
import StepTimeline from '../components/StepTimeline';

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
    const { detail, healthTestItemId } = useHealthTestDetailByGoalId(healthGoalId);
    const { records, improveDirectionVal, latestTwoRecords, exPatientRuleId, reload: reloadRecords } = useHealthTestRecords({
        healthGoalId,
        healthTestItemId,
        userId,
    });
    const [recordInput, setRecordInput] = useState('');
    const [recordModalVisible, setRecordModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const unit = detail?.unit?.trim() || '次';
    const firstRecord = records?.firstRecord;
    const latestRecord = records?.latestRecord;
    const firstValue = firstRecord?.testValue;
    const latestValue = latestRecord?.testValue;
    const targetValue = useMemo(
        () => calcTargetFromInitial(firstValue, improveDirectionVal, detail?.improveDirection),
        [firstValue, improveDirectionVal, detail?.improveDirection],
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
    const gradientId = useId().replace(/:/g, '');
    const progress = useMemo(
        () => calcGaugeProgress(firstValue, latestValue, targetValue),
        [firstValue, latestValue, targetValue],
    );

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
        const testValue = Number(recordInput);
        return recordInput.trim() !== '' && !Number.isNaN(testValue) && testValue >= 0;
    }, [recordInput]);

    const openRecordModal = useCallback(() => {
        setRecordInput('');
        setRecordModalVisible(true);
    }, []);

    const closeRecordModal = useCallback(() => {
        setRecordModalVisible(false);
        setRecordInput('');
    }, []);

    const submitRecord = useCallback(async (testValue: number) => {
        if (!exPatientRuleId || healthTestItemId == null) {
            Toast.fail('缺少处方信息，无法保存');
            return false;
        }

        setSubmitting(true);
        try {
            const res = await addExHealthTestRecord({
                exPatientRuleId: String(exPatientRuleId),
                healthTestItemId: String(healthTestItemId),
                testValue,
            });
            if (isResourceApiOk(res)) {
                Toast.success('记录成功');
                closeRecordModal();
                reloadRecords();
                return true;
            }
            Toast.fail((res as { msg?: string })?.msg || '保存失败');
            setRecordModalVisible(true);
            return false;
        } catch {
            Toast.fail('保存失败');
            setRecordModalVisible(true);
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [closeRecordModal, exPatientRuleId, healthTestItemId, reloadRecords]);

    const handleConfirmRecord = useCallback(() => {
        if (!canSubmitRecord || submitting) return;
        void submitRecord(Number(recordInput));
    }, [canSubmitRecord, recordInput, submitRecord, submitting]);

    return (
        <PageLayout style={styles.container} headerBackSource={TESTING_HEADER_BG} edges={[]}>
            <View style={styles.page}>
                <ScrollView style={styles.body} contentContainerStyle={styles.scroll}>
                    <View style={styles.rowBox}>
                        <Flex style={styles.rightBox}>
                            <Image style={styles.rightImg} source={require('@/assets/images/schedule/leftImg.png')} />
                            <Image style={styles.rightTime} source={require('@/assets/images/schedule/rightTime.png')} />
                            <Text style={styles.rightText}>{detail?.estimatedTime?.trim() || '约1分钟'}</Text>
                        </Flex>

                        <View>
                            <Text style={styles.rowTitle}>{testName}</Text>
                            <Flex style={{ marginTop: 6 }}>
                                <Text style={styles.rowText}>{detail?.recommendFrequency?.trim() || '--'}</Text>
                                <Image style={styles.rowImg} source={require('@/assets/images/schedule/up.png')} />
                            </Flex>
                        </View>

                        <Flex align="end" style={styles.gaugeBox}>
                            <Flex direction="column" style={styles.gaugeTitleBox}>
                                <Text style={styles.gaugeValue}>{formatGaugeValue(firstValue)}</Text>
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
                                        <Text style={styles.gaugeTopCenterValue}>{formatGaugeValue(latestValue)}</Text>
                                        <Text style={styles.gaugeTopCenterText}>当前({unit})</Text>
                                    </View>
                                </View>
                            </View>
                            <Flex direction="column" style={styles.gaugeTitleBox}>
                                <Text style={styles.gaugeValue}>{formatGaugeValue(targetValue)}</Text>
                                <Text style={styles.gaugeText}>目标({unit})</Text>
                            </Flex>
                        </Flex>
                        <Flex style={styles.gaugeUpBox}>
                            <Image style={styles.gaugeUpImg} source={require('@/assets/images/schedule/icon_up.png')} />
                            <Text style={styles.gaugeUpText}>
                                {getImproveLabel(latestRecord?.firstChangePercent, { firstRecord, latestRecord })}
                            </Text>
                        </Flex>
                    </View>
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
                                latestTwoRecords.map((record, index) => (
                                    <Flex
                                        key={String(record.id ?? record.createTime ?? index)}
                                        justify='between'
                                        style={[
                                            styles.infoRecordItem,
                                            { paddingVertical: 12 },
                                            index > 0 ? { marginTop: 12 } : null,
                                        ]}>
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
                                            {(record.changeValue ?? 0) > 0 ? (
                                                <Image
                                                    style={styles.infoRecordUpImg}
                                                    source={require('@/assets/images/schedule/icon_up.png')}
                                                />
                                            ) : null}
                                            <Text style={styles.infoRecordText}>
                                                {formatTestValue(record.testValue, unit)}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                ))
                            ) : (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <Text style={styles.infoItemText}>暂无测试记录</Text>
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
                        style={styles.bottomBarButtonLeft}
                        disabled={healthTestItemId == null}
                        onPress={() => navigateToResults()}>
                        <Flex justify='center' style={{ flex: 1 }} >
                            <Image style={styles.bottomBarButtonImg} source={require('@/assets/images/schedule/icon_start.png')} />
                            <Text style={styles.bottomBarButtonTextLeft}>开始测试</Text>
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
            </View>
            <BottomSheetModal
                visible={recordModalVisible}
                overlayOpacity={0.2}
                dismissOnBackdropPress={false}
                onClose={closeRecordModal}
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

                    <Flex align="center" style={recordModalStyles.inputWrap}>
                        <Text style={recordModalStyles.inputLabel}>测试结果</Text>
                        <TextInput
                            style={recordModalStyles.recordModalInput}
                            value={recordInput}
                            onChangeText={setRecordInput}
                            keyboardType="number-pad"
                            placeholder="请输入测试成绩"
                            placeholderTextColor="#CCCCCC"
                            underlineColorAndroid="transparent"
                        />
                        <Text style={recordModalStyles.inputUnit}>{unit}</Text>
                    </Flex>
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

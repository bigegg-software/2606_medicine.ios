import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Flex, Toast } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import styles from '@/css/schedule/results';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/route/router';
import { addExHealthTestRecord } from '@/api/exHealthTestRecord';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { useHealthTestDetailByItemId } from './useHealthTestDetail';
import { formatCountdownTime, isCountdownTimer, isForwardTimer, resolveTestTimerSeconds, } from './testingHelpers';

const CLOSE_ICON = require('@/assets/images/schedule/close.png');
const ICON_START = require('@/assets/images/schedule/icon_start.png');
const ICON_END = require('@/assets/images/schedule/icon_js.png');
const ICON_RECORD = require('@/assets/images/schedule/icon_record.png');
const RING_SIZE = 240;
const RING_STROKE = 17;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CENTER = RING_SIZE / 2;

type TestPhase = 'idle' | 'running' | 'submitting' | 'finished';

export default function TestingResultsPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'TestingResultsPage'>>();
    const insets = useSafeAreaInsets();
    const healthTestItemId = route.params?.healthTestItemId;
    const recordOnly = route.params?.recordOnly;
    const { detail, reload } = useHealthTestDetailByItemId(healthTestItemId);
    const testName = detail?.testName?.trim() || '坐站测试';
    const unit = detail?.unit?.trim() || '次';
    const isCountdown = isCountdownTimer(detail?.timerType);
    const isForward = isForwardTimer(detail?.timerType);
    const totalSeconds = useMemo(
        () => resolveTestTimerSeconds(detail ?? undefined),
        [detail?.estimatedTime, detail?.timerSeconds],
    );

    const [phase, setPhase] = useState<TestPhase>('idle');
    const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [recordInput, setRecordInput] = useState('');
    const [recordModalVisible, setRecordModalVisible] = useState(false);
    const [exPatientRuleId, setExPatientRuleId] = useState<string | number | undefined>();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const ringCircumference = useMemo(() => 2 * Math.PI * RING_RADIUS, []);
    const ringProgress = useMemo(() => {
        if (totalSeconds <= 0) return 100;
        return (remainingSeconds / totalSeconds) * 100;
    }, [remainingSeconds, totalSeconds]);
    const ringProgressLength = useMemo(() => {
        if (isForward) {
            return 0;
        }
        return (ringCircumference * ringProgress) / 100;
    }, [isForward, ringCircumference, ringProgress]);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const loadPrescription = useCallback(async () => {
        try {
            const res = await getInUseExPatientRuleInfo();
            if (!isResourceApiOk(res)) return;
            const prescription = apiResourceData<InUseExPatientRule>(res as any);
            if (prescription?.exPatientRuleId != null) {
                setExPatientRuleId(prescription.exPatientRuleId);
            }
        } catch {
            // ignore
        }
    }, []);

    const submitRecord = useCallback(async (testValue: number) => {
        if (!exPatientRuleId || !healthTestItemId) {
            Toast.show('缺少处方信息，无法保存');
            return false;
        }

        setPhase('submitting');
        try {
            const res = await addExHealthTestRecord({
                exPatientRuleId: String(exPatientRuleId),
                healthTestItemId: String(healthTestItemId),
                testValue,
            });
            if (isResourceApiOk(res)) {
                Toast.success('记录成功');
                setPhase('finished');
                setRecordModalVisible(false);
                navigation.goBack();
                return true;
            }
            Toast.show((res as { msg?: string })?.msg || '保存失败');
            setPhase(recordOnly ? 'idle' : 'running');
            setRecordModalVisible(true);
            return false;
        } catch {
            Toast.show('保存失败');
            setPhase(recordOnly ? 'idle' : 'running');
            setRecordModalVisible(true);
            return false;
        }
    }, [exPatientRuleId, healthTestItemId, navigation, recordOnly]);

    const resetTest = useCallback(() => {
        clearTimer();
        setPhase('idle');
        setRemainingSeconds(totalSeconds);
        setElapsedSeconds(0);
        setIsPaused(false);
        setRecordInput('');
        setRecordModalVisible(false);
    }, [clearTimer, totalSeconds]);

    const openRecordModal = useCallback(() => {
        clearTimer();
        setIsPaused(false);
        setRecordInput('');
        setRecordModalVisible(true);
    }, [clearTimer]);

    const startTimer = useCallback(() => {
        clearTimer();
        if (isCountdown) {
            timerRef.current = setInterval(() => {
                setRemainingSeconds(prev => {
                    if (prev <= 1) {
                        clearTimer();
                        setIsPaused(false);
                        openRecordModal();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return;
        }

        if (isForward) {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
    }, [clearTimer, isCountdown, isForward, openRecordModal]);

    const startTest = useCallback(() => {
        if (phase === 'submitting') return;
        if (phase === 'running' && !isPaused) return;

        if (phase === 'running' && isPaused) {
            setIsPaused(false);
            startTimer();
            return;
        }

        setPhase('running');
        if (isCountdown) {
            setRemainingSeconds(totalSeconds);
        }
        if (isForward) {
            setElapsedSeconds(0);
        }
        setIsPaused(false);
        setRecordModalVisible(false);
        startTimer();
    }, [isCountdown, isForward, isPaused, phase, startTimer, totalSeconds]);

    const pauseTest = useCallback(() => {
        if (phase !== 'running' || isPaused) return;
        if (isCountdown && remainingSeconds <= 0) return;
        clearTimer();
        setIsPaused(true);
    }, [clearTimer, isCountdown, isPaused, phase, remainingSeconds]);

    const handleForwardEnd = useCallback(() => {
        if (phase === 'submitting') return;
        clearTimer();
        setIsPaused(false);
        if (phase === 'idle') {
            setPhase('running');
        }
        openRecordModal();
    }, [clearTimer, openRecordModal, phase]);

    const handleRecordResult = useCallback(() => {
        if (phase !== 'running') return;
        openRecordModal();
    }, [openRecordModal, phase]);

    const canSubmitRecord = useMemo(() => {
        const testValue = Number(recordInput);
        return recordInput.trim() !== '' && !Number.isNaN(testValue) && testValue >= 0;
    }, [recordInput]);

    const handleConfirmRecord = useCallback(() => {
        if (!canSubmitRecord) return;
        const testValue = Number(recordInput);
        setRecordModalVisible(false);
        void submitRecord(testValue);
    }, [canSubmitRecord, recordInput, submitRecord]);

    const closeRecordModal = useCallback(() => {
        setRecordModalVisible(false);
        if (recordOnly) {
            navigation.goBack();
            return;
        }
        if (isCountdown && remainingSeconds <= 0) {
            resetTest();
            return;
        }
        if (isForward && phase === 'running') {
            resetTest();
        }
    }, [isCountdown, isForward, navigation, phase, recordOnly, remainingSeconds, resetTest]);

    const isCountdownActive = isCountdown
        && phase === 'running'
        && remainingSeconds > 0
        && !recordModalVisible;
    const showCountdownRecordButton = isCountdown && (
        (phase === 'running' && remainingSeconds <= 0)
        || recordModalVisible
        || phase === 'submitting'
    );

    const handleRefresh = useCallback(() => {
        reload();
        resetTest();
    }, [reload, resetTest]);

    useEffect(() => {
        if (recordOnly && healthTestItemId) {
            openRecordModal();
        }
    }, [healthTestItemId, openRecordModal, recordOnly]);

    useEffect(() => {
        loadPrescription();
    }, [loadPrescription]);

    useEffect(() => {
        resetTest();
    }, [totalSeconds, resetTest]);

    useEffect(() => () => clearTimer(), [clearTimer]);

    useEffect(() => {
        navigation.setOptions({
            title: testName,
            headerLeft: () => null,
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginRight: 18 }}
                >
                    <Image source={CLOSE_ICON} style={styles.headerCloseIcon} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, testName]);

    const centerTitle = isForward ? '计时' : '倒计时';
    const centerTime = isForward
        ? formatCountdownTime(elapsedSeconds)
        : formatCountdownTime(remainingSeconds);
    const centerHint = detail?.referenceStandard?.trim()
        || detail?.testDescription?.trim()
        || '听到开始后，尽快完成起立到完全站直再坐下';

    const renderTimerDisplay = () => (
        <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <Circle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    stroke="#E5E9F2"
                    strokeWidth={RING_STROKE}
                    fill="none"
                />
                {!isForward ? (
                    <Circle
                        cx={RING_CENTER}
                        cy={RING_CENTER}
                        r={RING_RADIUS}
                        stroke="#6D925E"
                        strokeWidth={RING_STROKE}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${ringProgressLength} ${ringCircumference}`}
                        transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
                    />
                ) : null}
            </Svg>
            <View style={styles.ringCenter}>
                <Text style={styles.countdownText}>{centerTitle}</Text>
                <Text style={styles.countdownTime}>{centerTime}</Text>
            </View>
        </View>
    );

    const renderForwardBottomBar = () => (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRefresh}>
                <Image
                    style={styles.bottomBarSxImg}
                    source={require('@/assets/images/schedule/sx.png')}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.bottomBarButtonStart}
                activeOpacity={0.7}
                disabled={phase === 'submitting'}
                onPress={phase === 'running' && !isPaused ? pauseTest : startTest}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <Image
                        tintColor="#FFF"
                        style={styles.bottomBarButtonImg}
                        source={phase === 'running' && !isPaused ? ICON_END : ICON_START}
                    />
                    <Text style={styles.bottomBarButtonText}>
                        {phase === 'running' && !isPaused ? '暂停' : phase === 'running' && isPaused ? '继续' : '开始'}
                    </Text>
                </Flex>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.bottomBarButtonEnd}
                activeOpacity={0.7}
                disabled={phase === 'submitting'}
                onPress={handleForwardEnd}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <Image
                        style={styles.bottomBarButtonImg}
                        source={ICON_RECORD}
                    />
                    <Text style={styles.bottomBarButtonEndText}>结束</Text>
                </Flex>
            </TouchableOpacity>
        </>
    );

    const renderCountdownBottomBar = () => {
        if (showCountdownRecordButton) {
            return (
                <TouchableOpacity
                    style={styles.bottomBarButtonFull}
                    activeOpacity={0.7}
                    disabled={phase === 'submitting'}
                    onPress={handleRecordResult}>
                    <Flex justify="center" style={{ flex: 1 }}>
                        <Image
                            tintColor="#FFF"
                            style={styles.bottomBarButtonImg}
                            source={ICON_RECORD}
                        />
                        <Text style={styles.bottomBarButtonText}>
                            {phase === 'submitting' ? '保存中' : '记录结果'}
                        </Text>
                    </Flex>
                </TouchableOpacity>
            );
        }

        return (
            <>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleRefresh}>
                    <Image
                        style={styles.bottomBarSxImg}
                        source={require('@/assets/images/schedule/sx.png')}
                    />
                </TouchableOpacity>
                {isCountdownActive ? (
                    <TouchableOpacity
                        style={styles.bottomBarButtonStart}
                        activeOpacity={0.7}
                        onPress={isPaused ? startTest : pauseTest}>
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                tintColor="#FFF"
                                style={styles.bottomBarButtonImg}
                                source={isPaused ? ICON_START : ICON_END}
                            />
                            <Text style={styles.bottomBarButtonText}>
                                {isPaused ? '继续' : '暂停'}
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.bottomBarButtonStart}
                        activeOpacity={0.7}
                        onPress={startTest}>
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                style={styles.bottomBarButtonImg}
                                source={ICON_START}
                            />
                            <Text style={styles.bottomBarButtonText}>开始</Text>
                        </Flex>
                    </TouchableOpacity>
                )}
            </>
        );
    };

    return (
        <PageLayout
            style={styles.container}
            showHeaderBackground={false}
            edges={[]}>
            <View style={styles.page}>
                <View style={styles.pageContent}>
                    {renderTimerDisplay()}
                    <Flex style={styles.countdownTextWrap}>
                        <Text style={styles.countdownText}>{centerHint}</Text>
                    </Flex>
                </View>
            </View>
            <Flex
                justify={!isForward && showCountdownRecordButton ? 'center' : 'between'}
                align="center"
                style={[
                    styles.bottomBar,
                    { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                ]}
            >
                {isForward ? renderForwardBottomBar() : renderCountdownBottomBar()}
            </Flex>
            <BottomSheetModal
                visible={recordModalVisible}
                overlayOpacity={0.2}
                dismissOnBackdropPress={false}
                onClose={closeRecordModal}
                keyboardAccessory={<KeyboardDoneAccessory useOverlay />}
                sheetStyle={[styles.recordModalBox, { paddingBottom: insets.bottom }]}>
                <View style={styles.recordModalContent}>
                    <View style={styles.recordModalHeader}>
                        <Text style={styles.recordModalTitle}>记录测试结果</Text>
                        <TouchableOpacity
                            style={styles.recordModalClose}
                            activeOpacity={0.7}
                            onPress={closeRecordModal}>
                            <Image
                                style={styles.recordModalCloseIcon}
                                source={require('@/assets/images/schedule/close.png')}
                            />
                        </TouchableOpacity>
                    </View>

                    <Flex align="center" style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>测试结果</Text>
                        <TextInput
                            style={styles.recordModalInput}
                            value={recordInput}
                            onChangeText={setRecordInput}
                            keyboardType="number-pad"
                            placeholder="请输入测试成绩"
                            placeholderTextColor="#CCCCCC"
                            underlineColorAndroid="transparent"
                        />
                        <Text style={styles.inputUnit}>{unit}</Text>
                    </Flex>
                </View>
                <Flex style={styles.btnBox}>
                    <TouchableOpacity
                        style={[
                            styles.recordModalConfirm,
                            canSubmitRecord && phase !== 'submitting' && styles.recordModalConfirmEnabled,
                        ]}
                        activeOpacity={0.7}
                        disabled={!canSubmitRecord || phase === 'submitting'}
                        onPress={handleConfirmRecord}>
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                style={styles.bottomBarButtonImg}
                                source={require('@/assets/images/schedule/save.png')}
                            />
                            <Text style={styles.bottomBarButtonText}>
                                {phase === 'submitting' ? '保存中...' : '保存记录'}
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </BottomSheetModal>
        </PageLayout>
    );
}

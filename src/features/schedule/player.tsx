import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import moment from 'moment';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addExRecord } from '@/api/exRecord';
import type { ExVideoInfo } from '@/api/exVideo';
import { getInUseExPatientRuleInfo, type ExPatientRuleRatio } from '@/api/schedule';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import PageLayout from '@/src/components/PageLayout';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import styles from '@/css/schedule/player';
import {
    calcTrainingProgressPercent,
    findRuleRatio,
    formatSessionDuration,
    getExitConfirmContent,
    loadPlayerVideos,
    loadTodayExerciseDuration,
    sessionSecondsToRecordMinutes,
    splitMultilineText,
    type TodayExerciseDuration,
} from './playerHelpers';
import {
    getExerciseChildTypeLabel,
    getExerciseTypeLabel,
    loadScheduleDictMaps,
    loadTodayTaskProgressMap,
    PLAYER_SPORT_IMAGES,
    toTodayTaskItem,
    type ScheduleDictMaps,
} from './scheduleHelpers';
import StepTimeline from './components/StepTimeline';
import infoStyles from '@/css/schedule/testingPage';

type PrescriptionContext = {
    exPatientRuleId?: string;
    rule?: ExPatientRuleRatio;
};

function safePauseVideoPlayer(player: { pause: () => void }) {
    try {
        player.pause();
    } catch {
        // VideoView 卸载或页面退出时，native player 可能已释放
    }
}

function safePlayVideoPlayer(player: { play: () => void }) {
    try {
        player.play();
    } catch {
        // ignore released native player
    }
}

export default function PlayerPage() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'PlayerPage'>>();
    const [loading, setLoading] = useState(true);
    const [taskLoading, setTaskLoading] = useState(false);
    const [videos, setVideos] = useState<ExVideoInfo[]>([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [ruleRatioList, setRuleRatioList] = useState<ExPatientRuleRatio[]>([]);
    const [dictMaps, setDictMaps] = useState<ScheduleDictMaps | null>(null);
    const [todayTaskProgressMap, setTodayTaskProgressMap] = useState<Record<string, number>>({});
    const [prescriptionContext, setPrescriptionContext] = useState<PrescriptionContext>({});
    const [todayDuration, setTodayDuration] = useState<TodayExerciseDuration>({
        completedMinutes: 0,
        targetMinutes: 0,
    });
    const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
    const [isTraining, setIsTraining] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const sessionElapsedRef = useRef(0);
    const prescriptionContextRef = useRef<PrescriptionContext>({});
    const activeVideoRef = useRef<ExVideoInfo | undefined>(undefined);
    const isTrainingRef = useRef(false);
    const isSubmittingSessionRef = useRef(false);
    const hasAutoStartedRef = useRef(false);
    const allowExitRef = useRef(false);
    const todayDurationRef = useRef(todayDuration);
    const targetMinutesRef = useRef(0);
    const pagerRef = useRef<FlatList<ReturnType<typeof toTodayTaskItem>>>(null);
    const skipPagerSyncRef = useRef(false);
    const { width: pageWidth } = useWindowDimensions();

    sessionElapsedRef.current = sessionElapsedSeconds;
    prescriptionContextRef.current = prescriptionContext;
    activeVideoRef.current = videos[activeVideoIndex];
    isTrainingRef.current = isTraining;
    todayDurationRef.current = todayDuration;

    const activeVideo = videos[activeVideoIndex];
    const videoUrl = activeVideo?.videoOssUrl?.trim() || null;
    const player = useVideoPlayer(videoUrl, instance => {
        instance.loop = true;
    });

    const stepLines = useMemo(
        () => splitMultilineText(activeVideo?.trainingSteps),
        [activeVideo?.trainingSteps],
    );
    const tipsLines = useMemo(
        () => splitMultilineText(activeVideo?.trainingPrompt),
        [activeVideo?.trainingPrompt],
    );
    const precautionLines = useMemo(
        () => splitMultilineText(activeVideo?.precautions),
        [activeVideo?.precautions],
    );

    const activeRule = ruleRatioList[activeTaskIndex];
    const todayTasks = useMemo(
        () => ruleRatioList.map((rule, index) =>
            toTodayTaskItem(rule, index, dictMaps ?? undefined, todayTaskProgressMap),
        ),
        [dictMaps, ruleRatioList, todayTaskProgressMap],
    );
    const activeTaskTitle = todayTasks[activeTaskIndex]?.title
        ?? getExerciseTypeLabel(activeRule?.exerciseType);
    const activeVideoTitle = activeVideo?.title?.trim()
        || getExerciseChildTypeLabel(
            activeVideo?.exerciseChildType,
            activeRule?.exerciseType,
            dictMaps ?? undefined,
        )
        || '训练视频';
    const targetMinutes = todayDuration.targetMinutes || activeRule?.duration || 0;
    targetMinutesRef.current = targetMinutes;
    const progressPercent = calcTrainingProgressPercent(sessionElapsedSeconds, targetMinutes);
    const sessionTimeText = formatSessionDuration(sessionElapsedSeconds);
    const headerDurationText = `${todayDuration.completedMinutes}/${targetMinutes || 0}分钟`;

    const refreshTodayDuration = useCallback(async (context: PrescriptionContext) => {
        const nextDuration = await loadTodayExerciseDuration(
            context.exPatientRuleId,
            context.rule?.exerciseType,
            context.rule?.duration,
        );
        setTodayDuration(nextDuration);
    }, []);

    const submitSessionRecord = useCallback(async (elapsedSecondsOverride?: number) => {
        if (isSubmittingSessionRef.current) return;

        const elapsedSeconds = elapsedSecondsOverride ?? sessionElapsedRef.current;
        const minutes = sessionSecondsToRecordMinutes(elapsedSeconds);
        const context = prescriptionContextRef.current;
        const video = activeVideoRef.current;

        if (minutes <= 0 || !context.exPatientRuleId || !context.rule?.exerciseType?.trim()) {
            setSessionElapsedSeconds(0);
            return;
        }

        isSubmittingSessionRef.current = true;
        setSubmitting(true);
        try {
            await addExRecord({
                exPatientRuleId: context.exPatientRuleId,
                customerLocalDate: moment().format('YYYY-MM-DD'),
                exerciseType: context.rule.exerciseType.trim(),
                exerciseChildType: video?.exerciseChildType?.trim()
                    || context.rule.exerciseChildType?.trim()
                    || '',
                exerciseDuration: minutes,
            });
            setSessionElapsedSeconds(0);
            await refreshTodayDuration(context);
        } finally {
            isSubmittingSessionRef.current = false;
            setSubmitting(false);
        }
    }, [refreshTodayDuration]);

    const finishTrainingAndExit = useCallback(async (exitAction?: () => void) => {
        const sessionSeconds = sessionElapsedRef.current;
        if (sessionSeconds >= 60) {
            await submitSessionRecord(sessionSeconds);
        }
        allowExitRef.current = true;
        if (exitAction) {
            exitAction();
        } else {
            navigation.goBack();
        }
    }, [navigation, submitSessionRecord]);

    const showEndTrainingConfirm = useCallback((exitAction?: () => void) => {
        if (submitting) return;

        safePauseVideoPlayer(player);
        isTrainingRef.current = false;
        setIsTraining(false);

        const content = getExitConfirmContent(
            sessionElapsedRef.current,
            todayDurationRef.current.completedMinutes,
            targetMinutesRef.current,
        );

        Modal.alert(<Text style={styles.confirmTitle}>{content.title}</Text>, <Text style={styles.exitConfirmMessage}>{content.message}</Text>, [
            { text: '取消', style: 'cancel' },
            {
                text: '结束',
                onPress: () => void finishTrainingAndExit(exitAction),
            },
        ]);
    }, [finishTrainingAndExit, player, submitting]);

    const loadPageData = useCallback(async () => {
        allowExitRef.current = false;
        setLoading(true);
        setIsTraining(false);
        hasAutoStartedRef.current = false;
        setSessionElapsedSeconds(0);

        try {
            const [nextDictMaps, res] = await Promise.all([
                loadScheduleDictMaps().catch(() => null),
                getInUseExPatientRuleInfo(),
            ]);
            if (nextDictMaps) {
                setDictMaps(nextDictMaps);
            }

            const payload = res as unknown as {
                code?: number;
                data?: {
                    exPatientRuleId?: string | number;
                    ruleRatioList?: ExPatientRuleRatio[];
                };
            };
            const prescription = isResourceApiOk(payload)
                ? apiResourceData(payload)
                : undefined;
            const rules = prescription?.ruleRatioList ?? [];
            const exPatientRuleId = prescription?.exPatientRuleId != null
                ? String(prescription.exPatientRuleId)
                : undefined;
            const progressMap = exPatientRuleId
                ? await loadTodayTaskProgressMap(exPatientRuleId).catch(() => ({}))
                : {};

            let initialTaskIndex = 0;
            if (route.params?.taskIndex != null
                && route.params.taskIndex >= 0
                && rules[route.params.taskIndex]) {
                initialTaskIndex = route.params.taskIndex;
            } else {
                const typeKey = route.params?.exerciseType?.trim();
                const matchedIndex = typeKey
                    ? rules.findIndex(rule => rule.exerciseType?.trim() === typeKey)
                    : -1;
                initialTaskIndex = matchedIndex >= 0 ? matchedIndex : 0;
            }

            const rule = rules[initialTaskIndex] ?? findRuleRatio(
                rules,
                route.params?.exerciseType,
                route.params?.taskIndex,
            ) ?? {
                exerciseType: route.params?.exerciseType,
                exerciseChildType: route.params?.exerciseChildType,
                strengthLevel: route.params?.strengthLevel,
            };
            const context: PrescriptionContext = {
                exPatientRuleId,
                rule,
            };

            const [nextVideos, nextDuration] = await Promise.all([
                loadPlayerVideos(rule),
                loadTodayExerciseDuration(
                    exPatientRuleId,
                    rule.exerciseType,
                    rule.duration,
                ),
            ]);

            setRuleRatioList(rules);
            setTodayTaskProgressMap(progressMap);
            setActiveTaskIndex(initialTaskIndex);
            setPrescriptionContext(context);
            setVideos(nextVideos);
            setTodayDuration(nextDuration);
            setActiveVideoIndex(0);
        } catch {
            setRuleRatioList([]);
            setTodayTaskProgressMap({});
            setPrescriptionContext({});
            setVideos([]);
            setTodayDuration({ completedMinutes: 0, targetMinutes: 0 });
            setActiveTaskIndex(0);
            setActiveVideoIndex(0);
        } finally {
            setLoading(false);
        }
    }, [
        route.params?.exerciseChildType,
        route.params?.exerciseType,
        route.params?.strengthLevel,
        route.params?.taskIndex,
    ]);

    const handleSelectTask = useCallback(async (index: number) => {
        if (index === activeTaskIndex || taskLoading || !ruleRatioList[index]) return;

        const rule = ruleRatioList[index];
        const exPatientRuleId = prescriptionContext.exPatientRuleId;

        setActiveTaskIndex(index);
        setTaskLoading(true);
        setSessionElapsedSeconds(0);
        hasAutoStartedRef.current = false;

        const context: PrescriptionContext = { exPatientRuleId, rule };

        try {
            const [nextVideos, nextDuration] = await Promise.all([
                loadPlayerVideos(rule),
                loadTodayExerciseDuration(
                    exPatientRuleId,
                    rule.exerciseType,
                    rule.duration,
                ),
            ]);
            setPrescriptionContext(context);
            setVideos(nextVideos);
            setTodayDuration(nextDuration);
            setActiveVideoIndex(0);
            isTrainingRef.current = true;
            setIsTraining(true);
        } catch {
            setPrescriptionContext(context);
            setVideos([]);
            setTodayDuration({ completedMinutes: 0, targetMinutes: rule.duration ?? 0 });
            setActiveVideoIndex(0);
        } finally {
            setTaskLoading(false);
        }
    }, [
        activeTaskIndex,
        prescriptionContext.exPatientRuleId,
        ruleRatioList,
        taskLoading,
    ]);

    const scrollPagerToIndex = useCallback((index: number, animated = true) => {
        if (index < 0 || index >= todayTasks.length) return;
        pagerRef.current?.scrollToIndex({ index, animated });
    }, [todayTasks.length]);

    const handlePagerMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
        if (index < 0 || index >= todayTasks.length || index === activeTaskIndex) return;

        skipPagerSyncRef.current = true;
        void handleSelectTask(index).finally(() => {
            skipPagerSyncRef.current = false;
        });
    }, [activeTaskIndex, handleSelectTask, pageWidth, todayTasks.length]);

    const handleTaskTabPress = useCallback((index: number) => {
        scrollPagerToIndex(index);
        void handleSelectTask(index);
    }, [handleSelectTask, scrollPagerToIndex]);

    useFocusEffect(
        useCallback(() => {
            allowExitRef.current = false;
            void loadPageData();
        }, [loadPageData]),
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', event => {
            safePauseVideoPlayer(player);

            if (allowExitRef.current || sessionElapsedRef.current <= 0) {
                return;
            }

            event.preventDefault();
            showEndTrainingConfirm(() => {
                navigation.dispatch(event.data.action);
            });
        });
        return unsubscribe;
    }, [navigation, player, showEndTrainingConfirm]);

    useEffect(() => {
        navigation.setOptions({
            title: activeTaskTitle,
            headerRight: () => (
                <Flex justify='center' style={styles.rightBox} >
                    <Text style={styles.rightText}>{headerDurationText}</Text>
                </Flex>
            ),
        });
    }, [activeTaskTitle, headerDurationText, navigation]);

    useEffect(() => {
        if (loading || skipPagerSyncRef.current || todayTasks.length === 0) return;

        requestAnimationFrame(() => {
            pagerRef.current?.scrollToIndex({
                index: activeTaskIndex,
                animated: false,
            });
        });
    }, [activeTaskIndex, loading, todayTasks.length]);

    useEffect(() => {
        if (!isTraining) return undefined;

        const timer = setInterval(() => {
            setSessionElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isTraining]);

    useEffect(() => {
        if (loading || taskLoading || !videoUrl || hasAutoStartedRef.current) return;

        hasAutoStartedRef.current = true;
        safePlayVideoPlayer(player);
        isTrainingRef.current = true;
        setIsTraining(true);
    }, [loading, taskLoading, player, videoUrl]);

    useEffect(() => {
        if (loading || taskLoading || !videoUrl || !hasAutoStartedRef.current) return;
        if (isTrainingRef.current) {
            safePlayVideoPlayer(player);
        }
    }, [activeVideoIndex, loading, player, taskLoading, videoUrl]);

    const handleToggleTraining = useCallback(() => {
        if (submitting) return;

        if (isTraining) {
            safePauseVideoPlayer(player);
            isTrainingRef.current = false;
            setIsTraining(false);
            return;
        }

        safePlayVideoPlayer(player);
        isTrainingRef.current = true;
        setIsTraining(true);
    }, [isTraining, player, submitting]);

    const handleResetTimer = useCallback(() => {
        if (submitting) return;
        setSessionElapsedSeconds(0);
    }, [submitting]);

    const handleNextVideo = useCallback(() => {
        if (taskLoading || submitting) return;

        if (videos.length <= 1) {
            Toast.info('没有更多了', 1.5);
            return;
        }

        setActiveVideoIndex(prev => (prev + 1) % videos.length);
    }, [submitting, taskLoading, videos.length]);

    const handleSubmitTraining = useCallback(() => {
        showEndTrainingConfirm();
    }, [showEndTrainingConfirm]);

    const renderTaskPage = (pageIndex: number) => {
        const isActivePage = pageIndex === activeTaskIndex;
        const pageTask = todayTasks[pageIndex];
        const pageRule = ruleRatioList[pageIndex];
        const pageVideoTitle = isActivePage
            ? activeVideoTitle
            : getExerciseTypeLabel(pageRule?.exerciseType);

        return (
            <ScrollView
                nestedScrollEnabled
                contentContainerStyle={styles.scroll}>
                <View style={styles.sportScrollWrap}>
                    <LinearGradient
                        pointerEvents="none"
                        colors={['#FFFFFF', 'rgba(255,255,255,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.sportScrollFade}
                    />
                    <ScrollView style={styles.sportScroll} horizontal showsHorizontalScrollIndicator={false}>
                        {todayTasks.map((task, index) => {
                            const typeKey = ruleRatioList[index]?.exerciseType?.trim() ?? '';
                            const isSelected = index === activeTaskIndex;
                            const sportIcon = PLAYER_SPORT_IMAGES[typeKey]
                                ?? require('@/assets/images/player/sport1.png');

                            return (
                                <TouchableOpacity
                                    key={task.key}
                                    disabled={taskLoading}
                                    onPress={() => handleTaskTabPress(index)}>
                                    <Flex style={[styles.sportBox, isSelected && styles.selectSport]}>
                                        <Image
                                            tintColor={isSelected ? '#FFF' : '#333333'}
                                            style={styles.sportImg}
                                            source={sportIcon}
                                        />
                                        <Text style={[styles.sportText, isSelected && styles.selectSportText]}>
                                            {task.title}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(255,255,255,0)', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.sportScrollMask}
                    />
                </View>

                <View style={styles.playerBox}>
                    <View style={styles.playerContent}>
                        {!isActivePage ? (
                            <Flex justify="center" style={{ flex: 1 }}>
                                <Text style={styles.pagePlaceholderText}>{pageTask?.title ?? '训练任务'}</Text>
                            </Flex>
                        ) : taskLoading ? (
                            <Flex justify="center" style={{ flex: 1 }}>
                                <ActivityIndicator color="#FFFFFF" />
                            </Flex>
                        ) : videoUrl ? (
                            <VideoView
                                style={styles.playerVideo}
                                player={player}
                                nativeControls
                                contentFit="contain"
                                allowsPictureInPicture={false}
                            />
                        ) : activeVideo?.coverOssUrl ? (
                            <Image
                                style={styles.playerCover}
                                source={{ uri: activeVideo.coverOssUrl }}
                                resizeMode="cover"
                            />
                        ) : null}
                    </View>

                    <Flex justify='between' style={styles.playerTitleBox}>
                        <Flex>
                            <Text style={styles.playerTitleText}>{pageVideoTitle}</Text>
                            <Flex style={styles.tjBtn}>
                                <Image style={styles.tjBtnImg} source={require('@/assets/images/player/tj.png')} />
                                <Text style={styles.tjBtnText}>推荐</Text>
                            </Flex>
                        </Flex>
                        <TouchableOpacity
                            disabled={!isActivePage || taskLoading || submitting}
                            onPress={handleNextVideo}>
                            <Image style={styles.playerTabImg} source={require('@/assets/images/player/tab.png')} />
                        </TouchableOpacity>
                    </Flex>
                </View>

                <View style={styles.sportInfoBox}>
                    <Flex justify='between' style={{ flex: 1 }} align="start">
                        <Flex>
                            <Image style={styles.xlImg} source={require('@/assets/images/player/xl.png')} />
                            <View style={styles.xlTextWrap}>
                                <Text style={styles.xlText}>实时心率</Text>
                                <Text style={styles.xlValue}>72 <Text style={styles.xlValueText}>次/分</Text></Text>
                            </View>
                        </Flex>
                        <Flex style={styles.xlStatus}>
                            <Text style={styles.xlStatusText}>正常</Text>
                        </Flex>
                    </Flex>
                    <View style={styles.lineBox}></View>
                    <Flex justify='between' style={{ marginTop: 10 }}>
                        <Flex>
                            <Image style={styles.msgImg} source={require('@/assets/images/player/msg.png')} />
                            <Text style={styles.msgText}>建议运动心率范围：100-130 次/分</Text>
                        </Flex>
                        <Text style={styles.statusText}>心率偏低</Text>
                    </Flex>
                </View>

                <Flex direction='column' style={styles.progressBoxWrap}>
                    <Text style={styles.progressTitle}>训练时间</Text>
                    <Text style={styles.progressText}>{isActivePage ? sessionTimeText : '00:00:00'}</Text>
                    <Flex style={styles.progressBox}>
                        <Flex
                            style={[
                                styles.progressBar,
                                { width: `${isActivePage ? progressPercent : 0}%` },
                            ]}
                            justify='end'>
                            {/* <View style={styles.progressBarInner} /> */}
                        </Flex>
                    </Flex>
                    <Flex style={styles.btnBox} justify='center'>
                        <TouchableOpacity
                            style={styles.btnIcon}
                            disabled={!isActivePage || submitting}
                            onPress={handleResetTimer}>
                            <Image
                                style={styles.btnIcon}
                                source={require('@/assets/images/player/start.png')}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.btnImgBox}
                            disabled={!isActivePage || submitting}
                            onPress={handleToggleTraining}>
                            <Image
                                style={styles.btnImg}
                                source={
                                    isTraining && isActivePage
                                        ? require('@/assets/images/player/stop.png')
                                        : require('@/assets/images/player/play.png')
                                }
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.btnIcon}
                            disabled={!isActivePage || submitting}
                            onPress={handleSubmitTraining}>
                            <Image
                                style={styles.btnIcon}
                                source={require('@/assets/images/player/end.png')}
                            />
                        </TouchableOpacity>
                    </Flex>
                </Flex>

                <View style={infoStyles.infoBox}>
                    <Text style={infoStyles.infoTitle}>训练步骤</Text>
                    {isActivePage && stepLines.length > 0 ? (
                        <StepTimeline steps={stepLines} />
                    ) : (
                        <View style={infoStyles.infoItem}>
                            <Text style={infoStyles.infoItemText}>
                                {!isActivePage
                                    ? '左右滑动切换任务'
                                    : videos.length === 0
                                        ? '暂无训练视频'
                                        : '暂无训练步骤'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={infoStyles.infoBox}>
                    <Text style={infoStyles.infoTitle}>训练提示</Text>
                    <View style={infoStyles.infoItem}>
                        {isActivePage && tipsLines.length > 0 ? tipsLines.map((line, index) => (
                            <Flex key={`tips-${pageIndex}-${index}`}>
                                <View style={[infoStyles.leftBor, { backgroundColor: '#6D925E' }]} />
                                <Text style={infoStyles.infoItemText}>{line}</Text>
                            </Flex>
                        )) : (
                            <Text style={infoStyles.infoItemText}>暂无训练提示</Text>
                        )}
                    </View>
                </View>
                <View style={infoStyles.infoBox}>
                    <Text style={infoStyles.infoTitle}>注意事项</Text>
                    <Flex justify="between" style={[infoStyles.infoItem, { backgroundColor: '#FDF3E9' }]}>
                        <View>
                            {isActivePage && precautionLines.length > 0 ? precautionLines.map((line, index) => (
                                <Flex key={`precaution-${pageIndex}-${index}`}>
                                    <View style={infoStyles.leftBor} />
                                    <Text style={infoStyles.infoItemText}>{line}</Text>
                                </Flex>
                            )) : (
                                <Text style={infoStyles.infoItemText}>暂无注意事项</Text>
                            )}
                        </View>
                    </Flex>
                </View>
            </ScrollView>
        );
    };

    if (loading) {
        return (
            <PageLayout style={styles.container} showHeaderBackground={false}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} showHeaderBackground={false}>
            <View style={styles.pageWrap}>
                <FlatList
                    ref={pagerRef}
                    data={todayTasks.length > 0 ? todayTasks : [{ key: 'empty', title: '训练任务', intro: '', progress: 0, icon: 0 }]}
                    horizontal
                    pagingEnabled
                    bounces={false}
                    scrollEnabled={!taskLoading && !submitting}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.key}
                    initialScrollIndex={activeTaskIndex}
                    getItemLayout={(_, index) => ({
                        length: pageWidth,
                        offset: pageWidth * index,
                        index,
                    })}
                    onMomentumScrollEnd={handlePagerMomentumEnd}
                    renderItem={({ index }) => (
                        <View style={[styles.pageItem, { width: pageWidth }]}>
                            {renderTaskPage(index)}
                        </View>
                    )}
                />

                {todayTasks.length > 1 ? (
                    <View style={styles.pageIndicatorWrap}>
                        <View style={styles.pageIndicator}>
                            {todayTasks.map((task, index) => (
                                <View
                                    key={task.key}
                                    style={[
                                        styles.pageDot,
                                        index === activeTaskIndex
                                            ? styles.pageDotActive
                                            : styles.pageDotInactive,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                ) : null}
            </View>
        </PageLayout>
    );
}

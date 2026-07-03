import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Flex } from '@ant-design/react-native';
import moment from 'moment';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addExRecord, postExRecordVideoView } from '@/api/exRecord';
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
    formatDurationFromSeconds,
    loadPlayerVideos,
    loadTodayExerciseDuration,
    sessionSecondsToRecordMinutes,
    splitMultilineText,
    type TodayExerciseDuration,
} from './playerHelpers';
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
    const [videos, setVideos] = useState<ExVideoInfo[]>([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [prescriptionContext, setPrescriptionContext] = useState<PrescriptionContext>({});
    const [todayDuration, setTodayDuration] = useState<TodayExerciseDuration>({
        completedMinutes: 0,
        targetMinutes: 0,
    });
    const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
    const [isTraining, setIsTraining] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const viewedVideoIdsRef = useRef<Set<number>>(new Set());
    const sessionElapsedRef = useRef(0);
    const prescriptionContextRef = useRef<PrescriptionContext>({});
    const activeVideoRef = useRef<ExVideoInfo | undefined>(undefined);
    const isTrainingRef = useRef(false);
    const isSubmittingSessionRef = useRef(false);
    const hasAutoStartedRef = useRef(false);

    sessionElapsedRef.current = sessionElapsedSeconds;
    prescriptionContextRef.current = prescriptionContext;
    activeVideoRef.current = videos[activeVideoIndex];
    isTrainingRef.current = isTraining;

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

    const totalElapsedSeconds = todayDuration.completedMinutes * 60 + sessionElapsedSeconds;
    const targetMinutes = todayDuration.targetMinutes || prescriptionContext.rule?.duration || 0;
    const progressPercent = calcTrainingProgressPercent(totalElapsedSeconds, targetMinutes);
    const currentTimeText = formatDurationFromSeconds(totalElapsedSeconds);
    const targetTimeText = formatDurationFromSeconds(Math.max(targetMinutes * 60, 0));

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

    const loadPageData = useCallback(async () => {
        setLoading(true);
        setIsTraining(false);
        hasAutoStartedRef.current = false;
        setSessionElapsedSeconds(0);
        viewedVideoIdsRef.current.clear();

        try {
            const res = await getInUseExPatientRuleInfo();
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
            const rule = findRuleRatio(
                prescription?.ruleRatioList,
                route.params?.exerciseType,
                route.params?.taskIndex,
            ) ?? {
                exerciseType: route.params?.exerciseType,
                exerciseChildType: route.params?.exerciseChildType,
                strengthLevel: route.params?.strengthLevel,
            };
            const context: PrescriptionContext = {
                exPatientRuleId: prescription?.exPatientRuleId != null
                    ? String(prescription.exPatientRuleId)
                    : undefined,
                rule,
            };

            const [nextVideos, nextDuration] = await Promise.all([
                loadPlayerVideos(rule),
                loadTodayExerciseDuration(
                    context.exPatientRuleId,
                    rule.exerciseType,
                    rule.duration,
                ),
            ]);

            setPrescriptionContext(context);
            setVideos(nextVideos);
            setTodayDuration(nextDuration);
            setActiveVideoIndex(0);
        } catch {
            setPrescriptionContext({});
            setVideos([]);
            setTodayDuration({ completedMinutes: 0, targetMinutes: 0 });
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

    useFocusEffect(
        useCallback(() => {
            void loadPageData();
        }, [loadPageData]),
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            safePauseVideoPlayer(player);
        });
        return unsubscribe;
    }, [navigation, player]);

    useEffect(() => {
        navigation.setOptions({
            title: activeVideo?.title?.trim() || '训练视频',
        });
    }, [activeVideo?.title, navigation]);

    useEffect(() => {
        if (!isTraining) return undefined;

        const timer = setInterval(() => {
            setSessionElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isTraining]);

    useEffect(() => {
        if (loading || !videoUrl || hasAutoStartedRef.current) return;

        hasAutoStartedRef.current = true;
        safePlayVideoPlayer(player);
        isTrainingRef.current = true;
        setIsTraining(true);
    }, [loading, player, videoUrl]);

    useEventListener(player, 'playingChange', ({ isPlaying }) => {
        if (!isPlaying) return;

        const videoId = activeVideoRef.current?.exVideoId;
        if (videoId == null || viewedVideoIdsRef.current.has(videoId)) return;

        viewedVideoIdsRef.current.add(videoId);
        postExRecordVideoView(videoId).catch(() => undefined);
    });

    const handleToggleTraining = useCallback(() => {
        if (submitting) return;

        if (isTraining) {
            isTrainingRef.current = false;
            setIsTraining(false);
            return;
        }

        isTrainingRef.current = true;
        setIsTraining(true);
    }, [isTraining, submitting]);

    const handlePrevVideo = useCallback(() => {
        // 暂不支持
    }, []);

    const handleSubmitTraining = useCallback(async () => {
        if (submitting) return;
        await submitSessionRecord(sessionElapsedRef.current);
    }, [submitSessionRecord, submitting]);

    if (loading) {
        return (
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.playerBox}>
                    {videoUrl ? (
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
                <Flex style={styles.progressBox}>
                    <Flex
                        style={[styles.progressBar, { width: `${progressPercent}%` }]}
                        justify='end'>
                        {progressPercent > 0 ? <View style={styles.progressBarInner} /> : null}
                    </Flex>
                </Flex>
                <Flex justify='between' style={styles.timeBox}>
                    <Text style={styles.timeText}>{currentTimeText}</Text>
                    <Text style={styles.timeAllText}>{targetTimeText}</Text>
                </Flex>

                <Flex style={styles.btnBox} justify='center'>
                    <View style={styles.btnIcon} />
                    <TouchableOpacity
                        style={styles.btnImgBox}
                        disabled={submitting}
                        onPress={handleToggleTraining}>
                        <Image
                            style={styles.btnImg}
                            source={
                                isTraining
                                    ? require('@/assets/images/player/blueStop.png')
                                    : require('@/assets/images/player/bluePlay.png')
                            }
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btnIcon}
                        disabled={submitting}
                        onPress={() => void handleSubmitTraining()}>
                        <Image
                            style={styles.btnIcon}
                            source={require('@/assets/images/player/icon2.png')}
                        />
                    </TouchableOpacity>
                </Flex>

                <View style={infoStyles.infoBox}>
                    <Text style={infoStyles.infoTitle}>训练步骤</Text>
                    {stepLines.length > 0 ? (
                        <StepTimeline steps={stepLines} />
                    ) : (
                        <View style={infoStyles.infoItem}>
                            <Text style={infoStyles.infoItemText}>
                                {videos.length === 0 ? '暂无训练视频' : '暂无训练步骤'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={infoStyles.infoBox}>
                    <Text style={infoStyles.infoTitle}>训练提示</Text>
                    <View style={infoStyles.infoItem}>
                        {tipsLines.length > 0 ? tipsLines.map((line, index) => (
                            <Flex key={`tips-${index}`}>
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
                            {precautionLines.length > 0 ? precautionLines.map((line, index) => (
                                <Flex key={`precaution-${index}`}>
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
        </PageLayout>
    );
}

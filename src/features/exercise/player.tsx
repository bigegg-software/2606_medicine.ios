import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Flex, Modal, Toast } from '@ant-design/react-native';
import moment from 'moment';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addExRecord,
  markCompleteGroups,
  postExRecordVideoView,
  type ExRecordTrainingPhase,
} from '@/api/exRecord';
import type { ExVideoInfo } from '@/api/exVideo';
import type { ExPatientRuleRatio } from '@/api/schedule';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import PageLayout from '@/src/components/PageLayout';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import styles from '@/css/schedule/player';
import exerciseStyles from '@/css/exercise';
import { formatChineseGroupLabel } from './utils/trainingPhaseHelpers';
import {
  calcTrainingProgressPercent,
  formatSessionDuration,
  getExercisePlayerTypeLabel,
  getExitConfirmContent,
  loadExercisePlayerContext,
  normalizeCompleteGroups,
  refreshExercisePlayerDuration,
  sessionSecondsToRecordMinutes,
  toggleCompleteGroup,
  type ExercisePlayerDuration,
} from './utils/exercisePlayerHelpers';

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

export default function ExercisePlayerPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ExercisePlayerPage'>>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<ExVideoInfo | null>(null);
  const [prescriptionContext, setPrescriptionContext] = useState<PrescriptionContext>({});
  const [todayDuration, setTodayDuration] = useState<ExercisePlayerDuration>({
    completedMinutes: 0,
    targetMinutes: 0,
  });
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedGroups, setCompletedGroups] = useState<number[]>([]);
  const [markingGroup, setMarkingGroup] = useState(false);

  const viewedVideoIdsRef = useRef<Set<string>>(new Set());
  const sessionElapsedRef = useRef(0);
  const prescriptionContextRef = useRef<PrescriptionContext>({});
  const videoRef = useRef<ExVideoInfo | null>(null);
  const completedGroupsRef = useRef<number[]>([]);
  const isTrainingRef = useRef(false);
  const isSubmittingSessionRef = useRef(false);
  const hasAutoStartedRef = useRef(false);
  const allowExitRef = useRef(false);
  const todayDurationRef = useRef(todayDuration);
  const targetMinutesRef = useRef(0);

  sessionElapsedRef.current = sessionElapsedSeconds;
  prescriptionContextRef.current = prescriptionContext;
  videoRef.current = video;
  completedGroupsRef.current = completedGroups;
  isTrainingRef.current = isTraining;
  todayDurationRef.current = todayDuration;

  const videoUrl = video?.videoOssUrl?.trim() || null;
  const player = useVideoPlayer(videoUrl, instance => {
    instance.loop = true;
  });

  const activeRule = prescriptionContext.rule;
  const pageTitle = route.params?.title?.trim()
    || getExercisePlayerTypeLabel(activeRule?.exerciseType)
    || '训练';
  const videoTitle = video?.title?.trim()
    || route.params?.title?.trim()
    || '训练视频';
  const targetMinutes = todayDuration.targetMinutes || activeRule?.duration || 0;
  targetMinutesRef.current = targetMinutes;
  const progressPercent = calcTrainingProgressPercent(sessionElapsedSeconds, targetMinutes);
  const sessionTimeText = formatSessionDuration(sessionElapsedSeconds);
  const headerDurationText = `${todayDuration.completedMinutes}/${targetMinutes || 0}分钟`;
  const ruleSubtitle = route.params?.ruleSubtitle?.trim() || '';
  const totalGroups = Math.max(0, Math.round(Number(route.params?.groupVal) || 0));
  const trainingPhase = (route.params?.trainingPhase?.trim() || 'hot') as ExRecordTrainingPhase;
  const timerType = route.params?.timerType?.trim() || video?.timerType?.trim() || '';
  const showHeaderDuration = timerType === 'duration_min';
  const readOnly = Boolean(route.params?.readOnly);
  const customerLocalDate = route.params?.customerLocalDate?.trim()
    || moment().format('YYYY-MM-DD');

  const submitSessionRecord = useCallback(async (elapsedSecondsOverride?: number) => {
    if (isSubmittingSessionRef.current) return;

    const elapsedSeconds = elapsedSecondsOverride ?? sessionElapsedRef.current;
    const minutes = sessionSecondsToRecordMinutes(elapsedSeconds);
    const context = prescriptionContextRef.current;
    const currentVideo = videoRef.current;

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
        exerciseChildType: currentVideo?.exerciseChildType?.trim()
          || context.rule.exerciseChildType?.trim()
          || '',
        exerciseDuration: minutes,
      });
      setSessionElapsedSeconds(0);
      const nextDuration = await refreshExercisePlayerDuration({
        exPatientRuleId: context.exPatientRuleId,
        trainingPhase,
        exerciseType: context.rule.exerciseType,
        exVideoId: currentVideo?.exVideoId != null
          ? String(currentVideo.exVideoId)
          : route.params?.exVideoId,
        fallbackTargetMinutes: context.rule.duration,
      });
      setTodayDuration(nextDuration);
    } finally {
      isSubmittingSessionRef.current = false;
      setSubmitting(false);
    }
  }, [route.params?.exVideoId, trainingPhase]);

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

    Modal.alert(
      <Text style={styles.confirmTitle}>{content.title}</Text>,
      <Text style={styles.exitConfirmMessage}>{content.message}</Text>,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '结束',
          onPress: () => void finishTrainingAndExit(exitAction),
        },
      ],
    );
  }, [finishTrainingAndExit, player, submitting]);

  const loadPageData = useCallback(async () => {
    allowExitRef.current = false;
    setLoading(true);
    setIsTraining(false);
    hasAutoStartedRef.current = false;
    setSessionElapsedSeconds(0);
    viewedVideoIdsRef.current.clear();

    try {
      const next = await loadExercisePlayerContext({
        exVideoId: route.params?.exVideoId,
        exerciseType: route.params?.exerciseType,
        exerciseChildType: route.params?.exerciseChildType,
        strengthLevel: route.params?.strengthLevel,
        taskIndex: route.params?.taskIndex,
        trainingPhase,
        customerLocalDate,
      });
      setPrescriptionContext({
        exPatientRuleId: next.exPatientRuleId,
        rule: next.rule,
      });
      setVideo(next.video);
      setTodayDuration(next.todayDuration);
      setCompletedGroups(next.completedGroups);
    } catch {
      setPrescriptionContext({});
      setVideo(null);
      setTodayDuration({ completedMinutes: 0, targetMinutes: 0 });
      setCompletedGroups([]);
    } finally {
      setLoading(false);
    }
  }, [
    route.params?.exerciseChildType,
    route.params?.exerciseType,
    route.params?.exVideoId,
    route.params?.strengthLevel,
    route.params?.taskIndex,
    customerLocalDate,
    trainingPhase,
  ]);

  useFocusEffect(
    useCallback(() => {
      allowExitRef.current = false;
      void loadPageData();
    }, [loadPageData]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      safePauseVideoPlayer(player);

      if (readOnly || allowExitRef.current || sessionElapsedRef.current <= 0) {
        return;
      }

      event.preventDefault();
      showEndTrainingConfirm(() => {
        navigation.dispatch(event.data.action);
      });
    });
    return unsubscribe;
  }, [navigation, player, readOnly, showEndTrainingConfirm]);

  useEffect(() => {
    navigation.setOptions({
      title: pageTitle,
      headerRight: showHeaderDuration
        ? () => (
          <Flex justify="center" style={styles.rightBox}>
            <Text style={styles.rightText}>{headerDurationText}</Text>
          </Flex>
        )
        : () => null,
    });
  }, [headerDurationText, navigation, pageTitle, showHeaderDuration]);

  useEffect(() => {
    if (readOnly || !isTraining) return undefined;

    const timer = setInterval(() => {
      setSessionElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTraining, readOnly]);

  useEffect(() => {
    if (loading || !videoUrl || hasAutoStartedRef.current) return;

    hasAutoStartedRef.current = true;
    safePlayVideoPlayer(player);
    if (!readOnly) {
      isTrainingRef.current = true;
      setIsTraining(true);
    }
  }, [loading, player, readOnly, videoUrl]);

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!isPlaying || readOnly) return;

    const rawVideoId = videoRef.current?.exVideoId;
    if (rawVideoId == null || rawVideoId === '') return;
    const videoId = String(rawVideoId);
    if (viewedVideoIdsRef.current.has(videoId)) return;

    viewedVideoIdsRef.current.add(videoId);
    postExRecordVideoView(videoId).catch(() => undefined);
  });

  const handleToggleTraining = useCallback(() => {
    if (readOnly || submitting) return;

    if (isTraining) {
      safePauseVideoPlayer(player);
      isTrainingRef.current = false;
      setIsTraining(false);
      return;
    }

    safePlayVideoPlayer(player);
    isTrainingRef.current = true;
    setIsTraining(true);
  }, [isTraining, player, readOnly, submitting]);

  const handleResetTimer = useCallback(() => {
    if (readOnly || submitting) return;
    setSessionElapsedSeconds(0);
  }, [readOnly, submitting]);

  const handleSubmitTraining = useCallback(() => {
    if (readOnly) return;
    showEndTrainingConfirm();
  }, [readOnly, showEndTrainingConfirm]);

  const handleToggleGroup = useCallback((groupNo: number) => {
    if (readOnly || markingGroup || submitting) return;
    setCompletedGroups(prev => toggleCompleteGroup(prev, groupNo));
  }, [markingGroup, readOnly, submitting]);

  const handleSaveRecord = useCallback(async () => {
    if (readOnly || markingGroup || submitting) return;

    const context = prescriptionContextRef.current;
    const currentVideo = videoRef.current;
    const exPatientRuleId = context.exPatientRuleId;
    const exVideoId = currentVideo?.exVideoId != null
      ? String(currentVideo.exVideoId)
      : route.params?.exVideoId?.trim();

    if (!exPatientRuleId || !exVideoId) {
      Toast.info('暂无法保存', 1.5);
      return;
    }

    if (trainingPhase === 'main' && !context.rule?.exerciseType?.trim() && !route.params?.exerciseType?.trim()) {
      Toast.info('缺少运动类型', 1.5);
      return;
    }

    // 本次计时时长（分钟），与计时器同步；不足 1 分钟按 0 提交
    const exerciseDuration = sessionSecondsToRecordMinutes(
      sessionElapsedRef.current || sessionElapsedSeconds,
    );
    const groups = completedGroupsRef.current;
    const exerciseType = context.rule?.exerciseType?.trim()
      || route.params?.exerciseType?.trim()
      || currentVideo?.exerciseType?.trim()
      || undefined;

    setMarkingGroup(true);
    safePauseVideoPlayer(player);
    isTrainingRef.current = false;
    setIsTraining(false);

    try {
      const res = await markCompleteGroups({
        exPatientRuleId: String(exPatientRuleId),
        customerLocalDate: moment().format('YYYY-MM-DD'),
        trainingPhase,
        exerciseType: trainingPhase === 'main' ? exerciseType : undefined,
        exVideoId: String(exVideoId),
        exerciseDuration,
        complateGroups: groups,
      });

      if (!isResourceApiOk(res as unknown as { code?: number })) {
        Toast.info((res as { msg?: string })?.msg?.trim() || '保存失败', 1.5);
        return;
      }

      const data = apiResourceData<{ complateGroups?: number[]; exerciseDuration?: number }>(
        res as unknown as {
          code?: number;
          data?: { complateGroups?: number[]; exerciseDuration?: number };
        },
      );
      setCompletedGroups(normalizeCompleteGroups(data?.complateGroups ?? groups));

      if (exerciseDuration > 0) {
        setSessionElapsedSeconds(0);
      }
      const nextDuration = await refreshExercisePlayerDuration({
        exPatientRuleId,
        trainingPhase,
        exerciseType,
        exVideoId,
        fallbackTargetMinutes: context.rule?.duration,
      });
      setTodayDuration(nextDuration);

      Toast.info('保存成功', 1.5);
    } catch {
      Toast.info('保存失败', 1.5);
    } finally {
      setMarkingGroup(false);
    }
  }, [
    markingGroup,
    player,
    readOnly,
    route.params?.exerciseType,
    route.params?.exVideoId,
    sessionElapsedSeconds,
    submitting,
    trainingPhase,
  ]);

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
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}>
        <View style={[styles.playerBox, { marginTop: 0 }]}>
          <View style={styles.playerContent}>
            {videoUrl ? (
              <VideoView
                style={styles.playerVideo}
                player={player}
                nativeControls
                contentFit="contain"
                allowsPictureInPicture={false}
              />
            ) : video?.coverOssUrl ? (
              <Image
                style={styles.playerCover}
                source={{ uri: video.coverOssUrl }}
                resizeMode="cover"
              />
            ) : (
              <Flex justify="center" style={{ flex: 1 }}>
                <Text style={styles.pagePlaceholderText}>暂无训练视频</Text>
              </Flex>
            )}
          </View>

          <Flex justify="between" align="center" style={styles.playerTitleBox}>
            <Text style={[styles.playerTitleText, { flexShrink: 1 }]} numberOfLines={1}>
              {videoTitle}
            </Text>
            {ruleSubtitle ? (
              <Text style={styles.playerRuleSubtitle} numberOfLines={1}>
                {ruleSubtitle}
              </Text>
            ) : null}
          </Flex>
        </View>

        <Flex direction="column" style={styles.progressBoxWrap}>
          <Text style={styles.progressTitle}>训练时间</Text>
          <Text style={styles.progressText}>
            {readOnly
              ? formatSessionDuration((todayDuration.completedMinutes || 0) * 60)
              : sessionTimeText}
          </Text>
          <Flex style={styles.progressBox}>
            <Flex
              style={[
                styles.progressBar,
                {
                  width: `${readOnly
                    ? calcTrainingProgressPercent(
                      (todayDuration.completedMinutes || 0) * 60,
                      targetMinutes,
                    )
                    : progressPercent}%`,
                },
              ]}
              justify="end"
            />
          </Flex>
          {!readOnly ? (
          <Flex style={styles.btnBox} justify="center">
            <TouchableOpacity
              style={styles.btnIcon}
              disabled={submitting}
              onPress={handleResetTimer}>
              <Image
                style={styles.btnIcon}
                source={require('@/assets/images/player/start.png')}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnImgBox}
              disabled={submitting}
              onPress={handleToggleTraining}>
              <Image
                style={styles.btnImg}
                source={
                  isTraining
                    ? require('@/assets/images/player/stop.png')
                    : require('@/assets/images/player/play.png')
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnIcon}
              disabled={submitting}
              onPress={handleSubmitTraining}>
              <Image
                style={styles.btnIcon}
                source={require('@/assets/images/player/end.png')}
              />
            </TouchableOpacity>
          </Flex>
          ) : null}
        </Flex>

        {totalGroups > 0 ? (
          <Flex align="center" style={styles.playerGroupRow} wrap="wrap">
            {Array.from({ length: totalGroups }, (_, index) => {
              const groupNo = index + 1;
              const done = completedGroups.includes(groupNo);
              return (
                <TouchableOpacity
                  key={`group-${groupNo}`}
                  activeOpacity={0.75}
                  disabled={readOnly || markingGroup || submitting}
                  onPress={() => handleToggleGroup(groupNo)}>
                  <View style={[styles.playerGroupTag, done && styles.playerGroupTagDone]}>
                    <Text
                      style={[
                        styles.playerGroupTagText,
                        done && styles.playerGroupTagTextDone,
                      ]}>
                      {formatChineseGroupLabel(groupNo)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Flex>
        ) : null}
      </ScrollView>

      {!readOnly ? (
      <Flex
        justify="between"
        align="center"
        style={[
          exerciseStyles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}>
        <TouchableOpacity
          style={[exerciseStyles.bottomBarButtonLeft, { marginRight: 0, opacity: markingGroup || submitting ? 0.55 : 1 }]}
          activeOpacity={0.7}
          disabled={markingGroup || submitting}
          onPress={() => void handleSaveRecord()}>
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            <Text style={exerciseStyles.bottomBarButtonTextLeft}>
              {markingGroup ? '保存中...' : '保存数据'}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
      ) : null}
      </View>
    </PageLayout>
  );
}

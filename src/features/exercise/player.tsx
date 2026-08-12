import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import moment from 'moment';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addExRecord,
  markCompleteGroups,
  recordDuration,
  recordGroupCounts,
  recordKcal,
  type ExRecordTrainingPhase,
} from '@/api/exRecord';
import { recordExVideoView, type ExVideoInfo } from '@/api/exVideo';
import type { ExPatientRuleRatio } from '@/api/schedule';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import PageLayout from '@/src/components/PageLayout';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import styles from '@/css/schedule/player';
import exerciseStyles from '@/css/exercise';
import infoStyles from '@/css/schedule/testingPage';
import StepTimeline from '@/src/features/schedule/components/StepTimeline';
import { splitMultilineText } from '@/src/features/schedule/playerHelpers';
import GroupCountTags from './components/training/GroupCountTags';
import GroupCountInputModal from './components/training/GroupCountInputModal';
import { formatChineseGroupLabel } from './utils/trainingPhaseHelpers';
import {
  calcExerciseKcal,
  calcGroupRestProgressPercent,
  calcTrainingProgressPercent,
  canPressGroupCountTag,
  deriveCompleteGroupsFromCounts,
  findNextGroupInputIndex,
  formatSessionDuration,
  getExercisePlayerTypeLabel,
  getExitConfirmContent,
  getShortSessionConfirmContent,
  isGroupCountDone,
  isGroupDisplayDone,
  loadExercisePlayerContext,
  normalizeGroupCounts,
  refreshExercisePlayerDuration,
  resolveDurationSaveGroupTotal,
  resolveGroupInputMeta,
  resolvePlayerScheduleRule,
  resolveRestBetweenGroupSeconds,
  resolveSaveGroupTargetCount,
  sessionSecondsToRecordMinutes,
  setGroupCountAtIndex,
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
  const [groupCounts, setGroupCounts] = useState<number[]>([]);
  const [markingGroup, setMarkingGroup] = useState(false);
  const [groupInputIndex, setGroupInputIndex] = useState<number | null>(null);
  /** 组间休息倒计时中 */
  const [isGroupResting, setIsGroupResting] = useState(false);
  const [groupRestRemainingSeconds, setGroupRestRemainingSeconds] = useState(0);
  /** 组间休息倒计时是否在走（暂停/播放只控计时，不控视频） */
  const [isGroupRestTimerRunning, setIsGroupRestTimerRunning] = useState(false);

  const sessionElapsedRef = useRef(0);
  const prescriptionContextRef = useRef<PrescriptionContext>({});
  const videoRef = useRef<ExVideoInfo | null>(null);
  const groupCountsRef = useRef<number[]>([]);
  const isTrainingRef = useRef(false);
  const isGroupRestingRef = useRef(false);
  const groupRestTotalSecondsRef = useRef(0);
  const isSubmittingSessionRef = useRef(false);
  const hasAutoStartedRef = useRef(false);
  const hasRecordedViewRef = useRef(false);
  const allowExitRef = useRef(false);
  const todayDurationRef = useRef(todayDuration);
  const targetMinutesRef = useRef(0);

  sessionElapsedRef.current = sessionElapsedSeconds;
  prescriptionContextRef.current = prescriptionContext;
  videoRef.current = video;
  groupCountsRef.current = groupCounts;
  isTrainingRef.current = isTraining;
  isGroupRestingRef.current = isGroupResting;
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
  const targetMinutes = (() => {
    const fromRoute = Math.round(Number(route.params?.durationMinutes) || 0);
    if (fromRoute > 0) return fromRoute;
    return todayDuration.targetMinutes || activeRule?.duration || 0;
  })();
  targetMinutesRef.current = targetMinutes;
  const restBetweenGroupSeconds = resolveRestBetweenGroupSeconds(video?.restBetweenGroupSeconds);
  const progressPercent = isGroupResting
    ? calcGroupRestProgressPercent(groupRestRemainingSeconds, groupRestTotalSecondsRef.current)
    : calcTrainingProgressPercent(sessionElapsedSeconds, targetMinutes);
  const sessionTimeText = isGroupResting
    ? formatSessionDuration(groupRestRemainingSeconds)
    : formatSessionDuration(sessionElapsedSeconds);
  const headerDurationText = `${todayDuration.completedMinutes}/${targetMinutes || 0}分钟`;
  const ruleSubtitle = (() => {
    const raw = route.params?.ruleSubtitle?.trim() || '';
    if (!raw) return '';
    // 仅展示「20分钟」「10次 x 3组」，不展示部位等后缀
    return raw.split(' · ')[0]?.trim() || raw;
  })();
  const scheduleRule = resolvePlayerScheduleRule({
    routeGroupVal: route.params?.groupVal,
    routeNumberVal: route.params?.numberVal,
    routeKeepSecondVal: route.params?.keepSecondVal,
    routeTimerType: route.params?.timerType,
    videoGroupVal: video?.groupVal,
    videoNumberVal: video?.numberVal,
    videoKeepSecondVal: video?.keepSecondVal,
    videoTimerType: video?.timerType,
  });
  const totalGroups = scheduleRule.groupVal;
  const trainingPhase = (route.params?.trainingPhase?.trim() || 'hot') as ExRecordTrainingPhase;
  const timerType = scheduleRule.timerType;
  const isDurationTimer = timerType === 'duration_min';
  const showHeaderDuration = isDurationTimer;
  const saveGroupTotal = resolveDurationSaveGroupTotal(totalGroups, timerType);
  const groupTargetCount = scheduleRule.targetCount;
  const saveGroupTargetCount = resolveSaveGroupTargetCount(timerType, groupTargetCount);
  const groupInputMeta = resolveGroupInputMeta(timerType);
  const completedGroupCount = Array.from({ length: saveGroupTotal }, (_, index) =>
    isGroupDisplayDone(index, groupCounts, saveGroupTargetCount, null),
  ).filter(Boolean).length;
  const headerRightText = showHeaderDuration
    ? headerDurationText
    : saveGroupTotal > 0
      ? `${completedGroupCount}/${saveGroupTotal}组`
      : '';
  const nextSaveGroupIndex = !isDurationTimer && saveGroupTotal > 0
    ? findNextGroupInputIndex(groupCounts, saveGroupTotal)
    : -1;
  const saveRecordButtonLabel = markingGroup
    ? '保存中...'
    : nextSaveGroupIndex >= 0
      ? `保存数据·第${nextSaveGroupIndex + 1}组`
      : '保存数据';
  const saveRecordDisabled = markingGroup || submitting || isGroupResting;
  const readOnly = Boolean(route.params?.readOnly);
  const customerLocalDate = route.params?.customerLocalDate?.trim()
    || moment().format('YYYY-MM-DD');

  const stepLines = useMemo(
    () => splitMultilineText(video?.trainingSteps),
    [video?.trainingSteps],
  );
  const tipsLines = useMemo(
    () => splitMultilineText(video?.trainingPrompt),
    [video?.trainingPrompt],
  );
  const precautionLines = useMemo(
    () => splitMultilineText(video?.precautions),
    [video?.precautions],
  );

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

      const exVideoId = currentVideo?.exVideoId != null
        ? String(currentVideo.exVideoId)
        : route.params?.exVideoId?.trim();
      const exerciseKcal = calcExerciseKcal(currentVideo?.kcalPerMinute, minutes);
      if (exVideoId && exerciseKcal > 0) {
        await recordKcal({
          exPatientRuleId: String(context.exPatientRuleId),
          customerLocalDate: moment().format('YYYY-MM-DD'),
          trainingPhase,
          exerciseType: trainingPhase === 'main'
            ? context.rule.exerciseType.trim()
            : undefined,
          exVideoId,
          exerciseDuration: 0,
          exerciseKcal,
          complateGroups: [],
          complateGroupCounts: [],
        }).catch(() => undefined);
      }

      setSessionElapsedSeconds(0);
      const nextDuration = await refreshExercisePlayerDuration({
        exPatientRuleId: context.exPatientRuleId,
        trainingPhase,
        exerciseType: context.rule.exerciseType,
        exVideoId: currentVideo?.exVideoId != null
          ? String(currentVideo.exVideoId)
          : route.params?.exVideoId,
        fallbackTargetMinutes: targetMinutesRef.current || context.rule.duration,
      });
      setTodayDuration({
        completedMinutes: nextDuration.completedMinutes,
        targetMinutes: targetMinutesRef.current || nextDuration.targetMinutes,
      });
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

  /** 不足 1 分钟：取消继续 / 结束离开（不计入记录） */
  const showShortSessionAlert = useCallback((exitAction?: () => void) => {
    safePauseVideoPlayer(player);
    isTrainingRef.current = false;
    setIsTraining(false);

    const content = getShortSessionConfirmContent();
    Modal.alert(
      <Text style={styles.confirmTitle}>{content.title}</Text>,
      <Text style={styles.exitConfirmMessage}>{content.message}</Text>,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '结束',
          onPress: () => {
            allowExitRef.current = true;
            if (exitAction) {
              exitAction();
            } else {
              navigation.goBack();
            }
          },
        },
      ],
    );
  }, [navigation, player]);

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
    hasRecordedViewRef.current = false;
    isGroupRestingRef.current = false;
    groupRestTotalSecondsRef.current = 0;
    setIsGroupResting(false);
    setGroupRestRemainingSeconds(0);
    setIsGroupRestTimerRunning(false);
    setSessionElapsedSeconds(0);

    try {
      const next = await loadExercisePlayerContext({
        exVideoId: route.params?.exVideoId,
        exerciseType: route.params?.exerciseType,
        exerciseChildType: route.params?.exerciseChildType,
        strengthLevel: route.params?.strengthLevel,
        taskIndex: route.params?.taskIndex,
        trainingPhase,
        customerLocalDate,
        groupVal: route.params?.groupVal,
        numberVal: route.params?.numberVal,
        keepSecondVal: route.params?.keepSecondVal,
        timerType: route.params?.timerType,
      });
      setPrescriptionContext({
        exPatientRuleId: next.exPatientRuleId,
        rule: next.rule,
      });
      setVideo(next.video);
      const routeDuration = Math.round(Number(route.params?.durationMinutes) || 0);
      setTodayDuration({
        completedMinutes: next.todayDuration.completedMinutes,
        targetMinutes: routeDuration > 0 ? routeDuration : next.todayDuration.targetMinutes,
      });
      const nextRule = resolvePlayerScheduleRule({
        routeGroupVal: route.params?.groupVal,
        routeNumberVal: route.params?.numberVal,
        routeKeepSecondVal: route.params?.keepSecondVal,
        routeTimerType: route.params?.timerType,
        videoGroupVal: next.video?.groupVal,
        videoNumberVal: next.video?.numberVal,
        videoKeepSecondVal: next.video?.keepSecondVal,
        videoTimerType: next.video?.timerType,
      });
      setGroupCounts(normalizeGroupCounts(
        next.groupCounts,
        resolveDurationSaveGroupTotal(nextRule.groupVal, nextRule.timerType),
      ));
    } catch {
      setPrescriptionContext({});
      setVideo(null);
      setTodayDuration({ completedMinutes: 0, targetMinutes: 0 });
      setGroupCounts([]);
    } finally {
      setLoading(false);
    }
  }, [
    route.params?.exerciseChildType,
    route.params?.exerciseType,
    route.params?.exVideoId,
    route.params?.groupVal,
    route.params?.numberVal,
    route.params?.keepSecondVal,
    route.params?.durationMinutes,
    route.params?.timerType,
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

      // 仅计时类型需要时长退出确认；其它类型直接离开
      if (!isDurationTimer) {
        return;
      }

      event.preventDefault();
      showEndTrainingConfirm(() => {
        navigation.dispatch(event.data.action);
      });
    });
    return unsubscribe;
  }, [isDurationTimer, navigation, player, readOnly, showEndTrainingConfirm]);

  useEffect(() => {
    // 标题居中省略；限制标题最大宽度，避免挤出右侧标签
    const screenW = Dimensions.get('window').width;
    const titleMaxWidth = Math.floor(screenW * 0.42);
    navigation.setOptions({
      title: pageTitle,
      headerTitleAlign: 'center',
      headerRightContainerStyle: styles.headerRightContainer,
      headerTitleContainerStyle: styles.headerTitleContainer,
      headerTitle: () => (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.headerTitleText, { maxWidth: titleMaxWidth }]}>
          {pageTitle}
        </Text>
      ),
      headerRight: headerRightText
        ? () => (
          <View style={styles.rightBox}>
            <Text style={styles.rightText} numberOfLines={1}>
              {headerRightText}
            </Text>
          </View>
        )
        : () => null,
    } as never);
  }, [headerRightText, navigation, pageTitle]);

  useEffect(() => {
    if (readOnly || !isTraining || isGroupResting) return undefined;

    const timer = setInterval(() => {
      setSessionElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isGroupResting, isTraining, readOnly]);

  // 组间休息倒计时（可由暂停/播放暂停或继续，不控视频）
  useEffect(() => {
    if (readOnly || !isGroupResting || !isGroupRestTimerRunning) return undefined;

    const timer = setInterval(() => {
      setGroupRestRemainingSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isGroupRestTimerRunning, isGroupResting, readOnly]);

  useEffect(() => {
    if (loading || !videoUrl || hasAutoStartedRef.current) return;

    hasAutoStartedRef.current = true;
    safePlayVideoPlayer(player);
    if (!readOnly) {
      isTrainingRef.current = true;
      setIsTraining(true);
    }
  }, [loading, player, readOnly, videoUrl]);

  // 进入播放页且视频就绪后上报一次播放量
  useEffect(() => {
    if (loading || !videoUrl || hasRecordedViewRef.current) return;
    const exVideoId = video?.exVideoId != null
      ? String(video.exVideoId)
      : route.params?.exVideoId?.trim();
    if (!exVideoId) return;

    hasRecordedViewRef.current = true;
    recordExVideoView(exVideoId).catch(() => undefined);
  }, [loading, route.params?.exVideoId, video?.exVideoId, videoUrl]);

  const finishGroupRest = useCallback(() => {
    if (!isGroupRestingRef.current) return;
    isGroupRestingRef.current = false;
    groupRestTotalSecondsRef.current = 0;
    setIsGroupResting(false);
    setGroupRestRemainingSeconds(0);
    setIsGroupRestTimerRunning(false);
    setSessionElapsedSeconds(0);
    safePlayVideoPlayer(player);
    isTrainingRef.current = true;
    setIsTraining(true);
  }, [player]);

  // 倒计时归零后自动结束休息并恢复训练
  useEffect(() => {
    if (!isGroupResting || groupRestRemainingSeconds > 0) return;
    finishGroupRest();
  }, [finishGroupRest, groupRestRemainingSeconds, isGroupResting]);

  const startGroupRest = useCallback((seconds: number) => {
    const restSeconds = resolveRestBetweenGroupSeconds(seconds);
    if (restSeconds <= 0) {
      setSessionElapsedSeconds(0);
      setIsGroupRestTimerRunning(false);
      safePlayVideoPlayer(player);
      isTrainingRef.current = true;
      setIsTraining(true);
      return;
    }

    groupRestTotalSecondsRef.current = restSeconds;
    isGroupRestingRef.current = true;
    setGroupRestRemainingSeconds(restSeconds);
    setIsGroupResting(true);
    setIsGroupRestTimerRunning(true);
    setSessionElapsedSeconds(0);
    safePauseVideoPlayer(player);
    isTrainingRef.current = false;
    setIsTraining(false);
  }, [player]);

  const handleToggleTraining = useCallback(() => {
    if (readOnly || submitting) return;

    // 组间休息：暂停/播放只控制休息倒计时，不控制视频
    if (isGroupRestingRef.current) {
      setIsGroupRestTimerRunning(prev => !prev);
      return;
    }

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
    if (isGroupRestingRef.current) {
      setGroupRestRemainingSeconds(groupRestTotalSecondsRef.current);
      return;
    }
    setSessionElapsedSeconds(0);
  }, [readOnly, submitting]);

  const handleCloseGroupInput = useCallback(() => {
    setGroupInputIndex(null);
  }, []);

  /** 提交组别次数/分钟 + 本次时长到后端 */
  const submitRecordToServer = useCallback(async (
    countsInput: number[],
    options?: {
      goBackAfterSuccess?: boolean;
      successMessage?: string;
      /** 非最后一组：重置计时并自动继续播放 */
      resumeTraining?: boolean;
    },
  ) => {
    if (readOnly || markingGroup || submitting) return false;

    const context = prescriptionContextRef.current;
    const currentVideo = videoRef.current;
    const exPatientRuleId = context.exPatientRuleId;
    const exVideoId = currentVideo?.exVideoId != null
      ? String(currentVideo.exVideoId)
      : route.params?.exVideoId?.trim();

    if (!exPatientRuleId || !exVideoId) {
      Toast.info('暂无法保存', 1.5);
      return false;
    }

    if (trainingPhase === 'main' && !context.rule?.exerciseType?.trim() && !route.params?.exerciseType?.trim()) {
      Toast.info('缺少运动类型', 1.5);
      return false;
    }

    const sessionSeconds = sessionElapsedRef.current || sessionElapsedSeconds;
    const exerciseDuration = sessionSecondsToRecordMinutes(sessionSeconds);

    // 计时类型：不足 1 分钟不保存
    if (isDurationTimer && exerciseDuration <= 0) {
      showShortSessionAlert();
      return false;
    }

    const groupTotal = resolveDurationSaveGroupTotal(totalGroups, timerType);
    const countTarget = resolveSaveGroupTargetCount(timerType, groupTargetCount);
    const counts = normalizeGroupCounts(countsInput, groupTotal);
    const groups = deriveCompleteGroupsFromCounts(counts, countTarget);
    const exerciseType = context.rule?.exerciseType?.trim()
      || route.params?.exerciseType?.trim()
      || currentVideo?.exerciseType?.trim()
      || undefined;

    setMarkingGroup(true);
    safePauseVideoPlayer(player);
    isTrainingRef.current = false;
    setIsTraining(false);

    try {
      const basePayload = {
        exPatientRuleId: String(exPatientRuleId),
        customerLocalDate: moment().format('YYYY-MM-DD'),
        trainingPhase,
        exerciseType: trainingPhase === 'main' ? exerciseType : undefined,
        exVideoId: String(exVideoId),
        exerciseDuration,
      };

      let res;
      if (isDurationTimer) {
        res = await recordDuration({
          ...basePayload,
          complateGroups: [],
          complateGroupCounts: [],
        });
      } else {
        // recordGroupCounts：传完整每组次数，如 [11, 12, 12]；时长走 recordDuration
        res = await recordGroupCounts({
          ...basePayload,
          exerciseDuration: 0,
          complateGroups: [],
          complateGroupCounts: counts,
        });
        if (!isResourceApiOk(res as unknown as { code?: number })) {
          Toast.info((res as { msg?: string })?.msg?.trim() || '保存失败', 1.5);
          return false;
        }

        // markCompleteGroups：只传已达标组号，如 [2, 3]；未完成的不传
        // groups 已由 deriveCompleteGroupsFromCounts 过滤达标组
        if (groups.length > 0) {
          res = await markCompleteGroups({
            ...basePayload,
            exerciseDuration: 0,
            complateGroups: groups,
            complateGroupCounts: [],
          });
          if (!isResourceApiOk(res as unknown as { code?: number })) {
            Toast.info((res as { msg?: string })?.msg?.trim() || '保存失败', 1.5);
            return false;
          }
        }

        // 组类型：满 1 分钟才累加时长，不足则静默跳过
        if (exerciseDuration > 0) {
          const durationRes = await recordDuration({
            ...basePayload,
            exerciseDuration,
            complateGroups: [],
            complateGroupCounts: [],
          });
          if (isResourceApiOk(durationRes as unknown as { code?: number })) {
            res = durationRes;
          }
        }
      }

      if (!isResourceApiOk(res as unknown as { code?: number })) {
        Toast.info((res as { msg?: string })?.msg?.trim() || '保存失败', 1.5);
        return false;
      }

      // recordKcal：有效字段 exerciseKcal = kcalPerMinute × 本次分钟；时长已由上一步写入，此处传 0
      const exerciseKcal = calcExerciseKcal(currentVideo?.kcalPerMinute, exerciseDuration);
      if (exerciseKcal > 0) {
        const kcalRes = await recordKcal({
          ...basePayload,
          exerciseDuration: 0,
          exerciseKcal,
          complateGroups: [],
          complateGroupCounts: [],
        });
        if (!isResourceApiOk(kcalRes as unknown as { code?: number })) {
          Toast.info((kcalRes as { msg?: string })?.msg?.trim() || '卡路里保存失败', 1.5);
          return false;
        }
      }

      const data = apiResourceData<{
        complateGroups?: number[];
        complateGroupCounts?: number[];
        exerciseDuration?: number;
      }>(
        res as unknown as {
          code?: number;
          data?: {
            complateGroups?: number[];
            complateGroupCounts?: number[];
            exerciseDuration?: number;
          };
        },
      );
      if (!isDurationTimer) {
        setGroupCounts(normalizeGroupCounts(
          data?.complateGroupCounts?.length ? data.complateGroupCounts : counts,
          groupTotal,
        ));
      }

      const nextDuration = await refreshExercisePlayerDuration({
        exPatientRuleId,
        trainingPhase,
        exerciseType,
        exVideoId,
        fallbackTargetMinutes: targetMinutesRef.current || context.rule?.duration,
      });
      // 计时 / 组类型有成功累加时长时，优先用接口返回的累计分钟
      const apiCompleted = Math.round(Number(data?.exerciseDuration));
      setTodayDuration({
        completedMinutes: Number.isFinite(apiCompleted) && apiCompleted > 0
          ? apiCompleted
          : nextDuration.completedMinutes,
        targetMinutes: targetMinutesRef.current || nextDuration.targetMinutes,
      });

      Toast.info(options?.successMessage?.trim() || '保存成功', 1.5);

      if (options?.goBackAfterSuccess) {
        allowExitRef.current = true;
        navigation.goBack();
        return true;
      }

      if (options?.resumeTraining) {
        // 保存上一组后进入组间休息；休息结束再续播并开始训练计时
        startGroupRest(resolveRestBetweenGroupSeconds(currentVideo?.restBetweenGroupSeconds));
      } else if (exerciseDuration > 0) {
        setSessionElapsedSeconds(0);
      }

      return true;
    } catch {
      Toast.info('保存失败', 1.5);
      return false;
    } finally {
      setMarkingGroup(false);
    }
  }, [
    groupTargetCount,
    isDurationTimer,
    markingGroup,
    navigation,
    player,
    readOnly,
    route.params?.exerciseType,
    route.params?.exVideoId,
    sessionElapsedSeconds,
    showShortSessionAlert,
    startGroupRest,
    submitting,
    timerType,
    totalGroups,
    trainingPhase,
  ]);

  const handlePressGroupTag = useCallback((index: number) => {
    if (readOnly || isDurationTimer || markingGroup || submitting || isGroupRestingRef.current) return;
    const groupTotal = resolveDurationSaveGroupTotal(totalGroups, timerType);
    const target = resolveSaveGroupTargetCount(timerType, groupTargetCount);
    // 当前待录入组 / 未达标进度可点；已达标不可点
    if (!canPressGroupCountTag(index, groupCountsRef.current, groupTotal, target)) return;

    safePauseVideoPlayer(player);
    isTrainingRef.current = false;
    setIsTraining(false);
    setGroupInputIndex(index);
  }, [
    groupTargetCount,
    isDurationTimer,
    markingGroup,
    player,
    readOnly,
    submitting,
    timerType,
    totalGroups,
  ]);

  const handleSaveGroupInput = useCallback((value: number) => {
    if (readOnly || groupInputIndex == null) return;
    const index = groupInputIndex;
    const groupTotal = resolveDurationSaveGroupTotal(totalGroups, timerType);
    const countTarget = resolveSaveGroupTargetCount(timerType, groupTargetCount);
    const prevCount = Math.max(0, Math.round(Number(groupCountsRef.current[index]) || 0));
    const isReEditIncomplete = prevCount > 0 && !isGroupCountDone(prevCount, countTarget);

    const nextCounts = setGroupCountAtIndex(groupCountsRef.current, index, groupTotal, value);
    groupCountsRef.current = nextCounts;
    setGroupCounts(nextCounts);
    setGroupInputIndex(null);

    const isLastGroup = index >= groupTotal - 1;
    void submitRecordToServer(nextCounts, {
      successMessage: `${formatChineseGroupLabel(index + 1)}保存成功`,
      // 未达标再编辑：保存后留在本页，不自动续播/返回
      goBackAfterSuccess: !isReEditIncomplete && isLastGroup,
      resumeTraining: !isReEditIncomplete && !isLastGroup,
    });
  }, [
    groupInputIndex,
    groupTargetCount,
    readOnly,
    submitRecordToServer,
    timerType,
    totalGroups,
  ]);

  /** 底部「保存数据」：计时类型只传时长；其它类型按序录入下一组 */
  const handleSaveRecord = useCallback(() => {
    if (readOnly || markingGroup || submitting || isGroupRestingRef.current) return;

    if (isDurationTimer) {
      const sessionSeconds = sessionElapsedRef.current;
      if (sessionSeconds < 60) {
        showShortSessionAlert();
        return;
      }

      void submitRecordToServer([], {
        goBackAfterSuccess: true,
        successMessage: '保存成功',
      });
      return;
    }

    const groupTotal = resolveDurationSaveGroupTotal(totalGroups, timerType);

    if (groupTotal > 0) {
      // [11]→第2组；[11,11]→第3组；无下一组→返回
      const nextIndex = findNextGroupInputIndex(groupCountsRef.current, groupTotal);

      if (nextIndex < 0) {
        allowExitRef.current = true;
        navigation.goBack();
        return;
      }

      safePauseVideoPlayer(player);
      isTrainingRef.current = false;
      setIsTraining(false);
      setGroupInputIndex(nextIndex);
      return;
    }

    void submitRecordToServer(groupCountsRef.current, {
      goBackAfterSuccess: true,
      successMessage: '保存成功',
    });
  }, [
    isDurationTimer,
    markingGroup,
    navigation,
    player,
    readOnly,
    showShortSessionAlert,
    submitting,
    submitRecordToServer,
    timerType,
    totalGroups,
  ]);

  /** 结束计时：默认与「保存数据」一致；组间休息时提前结束休息 */
  const handleSubmitTraining = useCallback(() => {
    if (readOnly) return;
    if (isGroupRestingRef.current) {
      finishGroupRest();
      return;
    }
    handleSaveRecord();
  }, [finishGroupRest, handleSaveRecord, readOnly]);

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
          <View style={exerciseStyles.playerRealtimeHrCard}>
            <Flex align="start">
              <Image
                style={exerciseStyles.playerRealtimeHrIcon}
                source={require('@/assets/images/exercise/icon_ssxl.png')}
              />
              <View style={exerciseStyles.playerRealtimeHrMain}>
                <Flex align="center" justify="between">
                  <Text style={exerciseStyles.playerRealtimeHrTitle}>实时心率</Text>
                  <View style={exerciseStyles.playerRealtimeHrBadge}>
                    <Text style={exerciseStyles.playerRealtimeHrBadgeText}>设备已连接</Text>
                  </View>
                </Flex>
                <Flex align="end" style={exerciseStyles.playerRealtimeHrValueRow}>
                  <Text style={exerciseStyles.playerRealtimeHrValue}>72</Text>
                  <Text style={exerciseStyles.playerRealtimeHrUnit}>次/分</Text>
                </Flex>
              </View>
            </Flex>

            <View style={exerciseStyles.playerRealtimeHrDivider} />

            <Flex align="center" justify="between" style={exerciseStyles.playerRealtimeHrTargetRow}>
              <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
                <Image
                  style={exerciseStyles.playerRealtimeHrTipIcon}
                  source={require('@/assets/images/exercise/icon_tip.png')}
                />
                <Text style={exerciseStyles.playerRealtimeHrTargetText} numberOfLines={1}>
                  目标心率区间：100-130 次/分
                </Text>
              </Flex>
              <Text style={exerciseStyles.playerRealtimeHrStatusText}>心率偏低</Text>
            </Flex>
          </View>
          <Flex direction="column" style={styles.progressBoxWrap}>
            <Text style={styles.progressTitle}>{isGroupResting ? '组间休息' : '训练时间'}</Text>
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
                      (isGroupResting ? isGroupRestTimerRunning : isTraining)
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

          {(!isDurationTimer && saveGroupTotal > 0) || (isDurationTimer && saveGroupTotal > 1) ? (
            <View>
              <GroupCountTags
                style={styles.playerGroupRow}
                totalGroups={saveGroupTotal}
                targetCount={saveGroupTargetCount}
                groupCounts={groupCounts}
                complateGroups={null}
                readOnly={readOnly || isDurationTimer || isGroupResting}
                onPressGroup={handlePressGroupTag}
              />
              {!readOnly ? (
                <Flex align="center" style={styles.playerGroupTipBox}>
                  <Image
                    style={styles.playerGroupTipIcon}
                    source={require('@/assets/images/exercise/icon_warn.png')}
                  />
                  <Text style={styles.playerGroupTipText}>
                    {isDurationTimer
                      ? '点击下方保存数据，将记录本次计时分钟'
                      : `点击组别依次记录每组完成情况；组间休息${restBetweenGroupSeconds}秒`}
                  </Text>
                </Flex>
              ) : null}
            </View>
          ) : null}

          <View style={infoStyles.infoBox}>
            <Text style={infoStyles.infoTitle}>训练步骤</Text>
            {stepLines.length > 0 ? (
              <StepTimeline steps={stepLines} showConnector={false} />
            ) : (
              <View style={infoStyles.infoItem}>
                <Text style={infoStyles.infoItemText}>
                  {video ? '暂无训练步骤' : '暂无训练视频'}
                </Text>
              </View>
            )}
          </View>
          <View style={infoStyles.infoBox}>
            <Text style={infoStyles.infoTitle}>训练提示</Text>
            <View style={infoStyles.infoItem}>
              {tipsLines.length > 0 ? (
                tipsLines.map((line, index) => (
                  <Flex
                    key={`tips-${index}`}
                    align="start"
                    style={index > 0 ? infoStyles.infoStepRowGap : undefined}>
                    <View style={[infoStyles.leftBor, { backgroundColor: '#6D925E', marginTop: 9 }]} />
                    <Text style={[infoStyles.infoItemText, { flex: 1 }]}>{line}</Text>
                  </Flex>
                ))
              ) : (
                <Text style={infoStyles.infoItemText}>暂无训练提示</Text>
              )}
            </View>
          </View>
          <View style={infoStyles.infoBox}>
            <Text style={infoStyles.infoTitle}>注意事项</Text>
            <View style={[infoStyles.infoItem, { backgroundColor: '#FDF3E9' }]}>
              {precautionLines.length > 0 ? (
                precautionLines.map((line, index) => (
                  <Flex
                    key={`precaution-${index}`}
                    align="start"
                    style={index > 0 ? infoStyles.infoStepRowGap : undefined}>
                    <View style={[infoStyles.leftBor, { marginTop: 9 }]} />
                    <Text style={[infoStyles.infoItemText, { flex: 1 }]}>{line}</Text>
                  </Flex>
                ))
              ) : (
                <Text style={infoStyles.infoItemText}>暂无注意事项</Text>
              )}
            </View>
          </View>
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
              style={[exerciseStyles.bottomBarButtonLeft, { marginRight: 0, opacity: saveRecordDisabled ? 0.55 : 1 }]}
              activeOpacity={0.7}
              disabled={saveRecordDisabled}
              onPress={handleSaveRecord}>
              <Flex justify="center" align="center" style={{ flex: 1 }}>
                <Text style={exerciseStyles.bottomBarButtonTextLeft}>
                  {saveRecordButtonLabel}
                </Text>
              </Flex>
            </TouchableOpacity>
          </Flex>
        ) : null}

        <GroupCountInputModal
          visible={!readOnly && groupInputIndex != null}
          groupIndex={groupInputIndex ?? 0}
          title={groupInputMeta.title}
          unit={groupInputMeta.unit}
          initialValue={groupInputIndex != null ? groupCounts[groupInputIndex] || 0 : 0}
          onClose={handleCloseGroupInput}
          onSave={handleSaveGroupInput}
        />
      </View>
    </PageLayout>
  );
}

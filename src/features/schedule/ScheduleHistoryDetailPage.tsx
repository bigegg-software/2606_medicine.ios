import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/schedule/historyDetail';
import scheduleStyles from '@/css/schedule/schedule';
import {
  loadHistoryPlanPageData,
  type HistoryPlanDetailSummary,
  type HistoryPlanTaskItem,
} from './historyPlanHelpers';
import { normalizeExerciseProgress } from '@/src/features/home/exercise/exerciseHelpers';
import type { ScheduleWeekStats } from './scheduleHelpers';

type HistoryDetailRoute = RouteProp<RootStackParamList, 'ScheduleHistoryDetailPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const PROGRESS_SIZE = 48;
const PROGRESS_STROKE = 6;

function ProgressRing({ progress }: { progress: number }) {
  const value = normalizeExerciseProgress(progress);
  const progressRadius = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
  const progressCenter = PROGRESS_SIZE / 2;
  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      {
        x: progressCenter - progressRadius,
        y: progressCenter - progressRadius,
        width: progressRadius * 2,
        height: progressRadius * 2,
      },
      -90,
      (360 * value) / 100,
    );
    return path;
  }, [progressCenter, progressRadius, value]);

  return (
    <View style={styles.progressRing}>
      <Canvas style={styles.progressCanvas}>
        <Circle
          cx={progressCenter}
          cy={progressCenter}
          r={progressRadius}
          color="rgba(5,58,147,0.14)"
          style="stroke"
          strokeWidth={PROGRESS_STROKE}
        />
        <Path
          path={progressPath}
          color="#053A93"
          style="stroke"
          strokeWidth={PROGRESS_STROKE}
          strokeCap="round"
        />
      </Canvas>
      <Text style={styles.progressText}>{value}%</Text>
    </View>
  );
}

function getStatusBadgeStyle(status?: number) {
  if (status === 2) {
    return {
      badge: styles.statusBadgeEnded,
      text: styles.statusBadgeTextEnded,
    };
  }
  if (status === 0) {
    return {
      badge: styles.statusBadgeActive,
      text: styles.statusBadgeTextActive,
    };
  }
  return {
    badge: styles.statusBadge,
    text: styles.statusBadgeText,
  };
}

function HistoryTaskCard({ task }: { task: HistoryPlanTaskItem }) {
  return (
    <View style={styles.taskCard}>
      <Flex justify="between" align="center">
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDuration}>{task.durationText}</Text>
      </Flex>
      {task.intro ? <Text style={styles.taskIntro}>{task.intro}</Text> : null}
      {task.projects ? <Text style={styles.taskProjects}>{task.projects}</Text> : null}
      <Flex justify="between" align="center" style={styles.taskFooter}>
        <Text style={styles.taskRatio}>{task.ratioText}</Text>
        <Text style={styles.taskCompletion}>完成 {task.completion}%</Text>
      </Flex>
    </View>
  );
}

const EMPTY_STATS: ScheduleWeekStats = {
  trainingCount: '--',
  completionRate: '--',
  totalDuration: '--',
  trainingDone: '--',
  trainingTotal: '',
  durationMinutes: '--',
};

export default function ScheduleHistoryDetailPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<HistoryDetailRoute>();
  const exPatientRuleId = route.params.exPatientRuleId;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HistoryPlanDetailSummary | null>(null);
  const [tasks, setTasks] = useState<HistoryPlanTaskItem[]>([]);
  const [stats, setStats] = useState<ScheduleWeekStats>(EMPTY_STATS);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadHistoryPlanPageData(exPatientRuleId);
      setSummary(data.summary);
      setTasks(data.tasks);
      setStats(data.stats);
    } catch {
      setSummary(null);
      setTasks([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [exPatientRuleId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  if (loading) {
    return (
      <PageLayout style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  if (!summary) {
    return (
      <PageLayout style={styles.container}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </PageLayout>
    );
  }

  const statusStyle = getStatusBadgeStyle(summary.status);

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Flex justify="between" align="center">
            <Text style={styles.prescriptionTitle}>{summary.title}</Text>
            <View style={[styles.statusBadge, statusStyle.badge]}>
              <Text style={[styles.statusBadgeText, statusStyle.text]}>{summary.statusLabel}</Text>
            </View>
          </Flex>
          <Text style={styles.doctorText}>{summary.doctorText}</Text>
          <Text style={styles.cycleText}>{summary.cycleText}</Text>
          <Text style={styles.metaText}>
            频率：{summary.frequencyText}  时长：{summary.durationText}
          </Text>
          <Flex justify="between" align="center" style={styles.progressRow}>
            <Text style={styles.progressLabel}>整体进度</Text>
            <ProgressRing progress={summary.progress} />
          </Flex>
          {summary.remark ? <Text style={styles.remarkText}>备注：{summary.remark}</Text> : null}
        </View>

        <Flex justify="between" align="center" style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>每日任务</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('TrainingStatsPage', {
                exPatientRuleId,
                startDate: summary.startDate,
                endDate: summary.endDate,
                initialWeek: 'last',
              });
            }}>
            <Text style={styles.sectionAction}>完成情况</Text>
          </TouchableOpacity>
        </Flex>

        {tasks.length === 0 ? (
          <View style={scheduleStyles.medicalBox}>
            <Text style={styles.emptyText}>暂无训练任务</Text>
          </View>
        ) : (
          tasks.map(task => <HistoryTaskCard key={task.key} task={task} />)
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>训练统计</Text>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.trainingCount}</Text>
            <Text style={styles.statTitle}>训练次数</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.completionRate}</Text>
            <Text style={styles.statTitle}>完成率</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalDuration}</Text>
            <Text style={styles.statTitle}>累计时长</Text>
          </View>
        </View>

        {summary.status === 1 ? (
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>处方已暂停</Text>
            <Text style={styles.pauseMeta}>暂停时间：{summary.stopTimeText}</Text>
            {summary.stopReason ? (
              <Text style={styles.pauseMeta}>暂停原因：{summary.stopReason}</Text>
            ) : null}
            <Text style={styles.pauseNote}>
              * 处方暂停由医护人员操作，如需恢复请联系您的主治医生
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </PageLayout>
  );
}

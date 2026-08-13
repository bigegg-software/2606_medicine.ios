import { Toast } from '@ant-design/react-native';
import moment from 'moment';
import {
  getExUserSignInfo,
  postExUserSign,
  type ExUserSignInfo,
} from '@/api/exUserSignInfo';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { loadExerciseDayStat } from './exerciseDayStatHelpers';
import {
  buildMainTrainingModules,
  isMainTrainingAllProgressStarted,
} from './trainingPhaseHelpers';

type SignSuccessListener = (signInfo: ExUserSignInfo | null) => void;
const signSuccessListeners = new Set<SignSuccessListener>();

/** 训练页订阅打卡成功，便于悬浮按钮打卡后刷新底部状态 */
export function subscribeExerciseSignSuccess(listener: SignSuccessListener) {
  signSuccessListeners.add(listener);
  return () => {
    signSuccessListeners.delete(listener);
  };
}

function emitExerciseSignSuccess(signInfo: ExUserSignInfo | null) {
  signSuccessListeners.forEach(listener => {
    try {
      listener(signInfo);
    } catch {
      // ignore listener errors
    }
  });
}

/** 主训练是否已完成（接口认定；半完成也算完成） */
export function isExerciseMainTrainingCompleted(info?: ExUserSignInfo | null) {
  if (info?.mainTrainingCompleted) return true;
  if (info?.canSign) return true;
  const total = Math.max(0, Math.round(Number(info?.mainTotalCount) || 0));
  const done = Math.max(0, Math.round(Number(info?.mainCompleteCount) || 0));
  return total > 0 && done >= total;
}

export function getExerciseSignButtonLabel(info?: ExUserSignInfo | null) {
  if (info?.signedToday) return '已完成今日打卡';
  return '完成今日打卡';
}

/** 不可打卡时的提示；可打卡返回 null */
export function getExerciseSignBlockedMessage(
  info?: ExUserSignInfo | null,
  options?: { mainProgressed?: boolean },
) {
  if (info?.signedToday) return '今日已打卡';
  if (options?.mainProgressed || isExerciseMainTrainingCompleted(info)) return null;
  return '请先完成主训练后再打卡（每项有进度即可）';
}

/** 是否允许完成今日打卡（与训练页底部按钮一致） */
export function resolveExerciseCanFinishSign(params: {
  signInfo?: ExUserSignInfo | null;
  mainAllProgressed?: boolean;
  mainTotalCount?: number;
  mainCompleteCount?: number;
}) {
  const { signInfo } = params;
  if (signInfo?.signedToday) return false;
  if (signInfo?.canSign) return true;
  if (params.mainAllProgressed) return true;
  if (isExerciseMainTrainingCompleted(signInfo)) return true;
  const total = Math.max(0, Math.round(Number(params.mainTotalCount) || 0));
  const done = Math.max(0, Math.round(Number(params.mainCompleteCount) || 0));
  return total > 0 && done >= total;
}

export type ExerciseDailySignResult = {
  ok: boolean;
  signInfo: ExUserSignInfo | null;
};

/**
 * 完成今日运动打卡（校验 + 提交 + Toast）。
 * 训练页底部「完成今日打卡」与右侧「戳我打卡」共用。
 */
export async function performExerciseDailySign(params: {
  isToday?: boolean;
  signInfo?: ExUserSignInfo | null;
  mainAllProgressed?: boolean;
  mainTotalCount?: number;
  mainCompleteCount?: number;
  /** 未传入资格字段时自行拉取今日数据 */
  autoLoadEligibility?: boolean;
  exerciseRule?: InUseExPatientRule | null;
}): Promise<ExerciseDailySignResult> {
  const isToday = params.isToday !== false;
  if (!isToday) {
    return { ok: false, signInfo: params.signInfo ?? null };
  }

  let signInfo = params.signInfo ?? null;
  let mainAllProgressed = Boolean(params.mainAllProgressed);
  let mainTotalCount = Math.max(0, Math.round(Number(params.mainTotalCount) || 0));
  let mainCompleteCount = Math.max(0, Math.round(Number(params.mainCompleteCount) || 0));

  if (params.autoLoadEligibility) {
    const today = moment().format('YYYY-MM-DD');
    const rule = params.exerciseRule ?? null;
    try {
      const [signRes, dayStat, mainResult] = await Promise.all([
        getExUserSignInfo().catch(() => null),
        loadExerciseDayStat({
          exPatientRuleId: rule?.exPatientRuleId,
          customerLocalDate: today,
        }),
        buildMainTrainingModules(rule, today).catch(() => null),
      ]);
      if (signRes && isResourceApiOk(signRes as unknown as { code?: number })) {
        signInfo = apiResourceData<ExUserSignInfo>(
          signRes as unknown as { code?: number; data?: ExUserSignInfo },
        ) ?? null;
      }
      mainTotalCount = dayStat.mainTotalCount;
      mainCompleteCount = dayStat.mainCompleteCount;
      if (mainResult && !mainResult.isRest) {
        mainAllProgressed = isMainTrainingAllProgressStarted(mainResult.modules);
      }
    } catch {
      // 继续用已有字段校验
    }
  }

  if (signInfo?.signedToday) {
    Toast.info('今日已打卡');
    return { ok: false, signInfo };
  }

  const canFinish = resolveExerciseCanFinishSign({
    signInfo,
    mainAllProgressed,
    mainTotalCount,
    mainCompleteCount,
  });
  if (!canFinish) {
    Toast.info(
      getExerciseSignBlockedMessage(signInfo, { mainProgressed: mainAllProgressed })
      || '请先完成主训练后再打卡（每项有进度即可）',
    );
    return { ok: false, signInfo };
  }

  const loadingKey = Toast.loading('打卡中…', 0);
  try {
    const res = await postExUserSign();
    if (!isResourceApiOk(res as unknown as { code?: number })) {
      Toast.info((res as { msg?: string })?.msg?.trim() || '打卡失败');
      return { ok: false, signInfo };
    }
    const next = apiResourceData<ExUserSignInfo>(
      res as unknown as { code?: number; data?: ExUserSignInfo },
    ) ?? null;
    Toast.info('打卡成功', 1.5);
    emitExerciseSignSuccess(next);
    return { ok: true, signInfo: next };
  } catch {
    Toast.info('打卡失败');
    return { ok: false, signInfo };
  } finally {
    Toast.remove(loadingKey);
  }
}

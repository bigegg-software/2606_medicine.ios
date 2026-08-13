/**
 * 播放器跨阶段续播后，返回训练列表时切换到对应页签。
 * 用模块变量传递，避免改动 ExercisePage 路由参数。
 */
export type TrainingPhaseTabKey = 'warmup' | 'main' | 'cooldown';

let pendingTrainingPhaseTab: TrainingPhaseTabKey | null = null;

export function setPendingTrainingPhaseTab(phase: TrainingPhaseTabKey) {
  pendingTrainingPhaseTab = phase;
}

/** 读取并清空待切换页签 */
export function consumePendingTrainingPhaseTab(): TrainingPhaseTabKey | null {
  const next = pendingTrainingPhaseTab;
  pendingTrainingPhaseTab = null;
  return next;
}

export function mapRecordPhaseToTrainingTab(
  phase?: string | null,
): TrainingPhaseTabKey {
  const key = phase?.trim();
  if (key === 'main') return 'main';
  if (key === 'cold') return 'cooldown';
  return 'warmup';
}

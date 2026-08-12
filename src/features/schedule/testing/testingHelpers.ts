import moment from 'moment';

export function formatTestValue(value?: number | null, unit = '次') {
  if (value == null || Number.isNaN(Number(value))) {
    return `--${unit}`;
  }
  const num = Number(value);
  const display = Number.isInteger(num) ? String(num) : String(Number(num.toFixed(2)));
  return `${display}${unit}`;
}

export function formatRecordDate(createTime?: string) {
  if (!createTime?.trim()) return '--';
  const date = moment(createTime);
  return date.isValid() ? date.format('YYYY/MM/DD') : '--';
}

export function calcTargetFromInitial(
  initialValue?: number | null,
  improveDirectionVal?: number | null,
  improveDirection?: number | null,
) {
  if (initialValue == null || Number.isNaN(Number(initialValue))) {
    return null;
  }
  if (improveDirectionVal == null || Number.isNaN(Number(improveDirectionVal))) {
    return null;
  }

  const initial = Number(initialValue);
  const ratio = Number(improveDirectionVal) / 100;
  if (improveDirection === -1) {
    return initial * (1 - ratio);
  }
  return initial * (1 + ratio);
}

function toFiniteNumber(value?: number | null) {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * 健康测试页：优先用处方配置的基准/目标；
 * 无基准时回退首次记录；无目标时按改善幅度从基准推算。
 */
export function resolveHealthTestGaugeValues(options: {
  configuredBaseline?: number | null;
  configuredTarget?: number | null;
  firstRecordValue?: number | null;
  improveDirectionVal?: number | null;
  improveDirection?: number | null;
}) {
  const baseline = toFiniteNumber(options.configuredBaseline)
    ?? toFiniteNumber(options.firstRecordValue);
  const configuredTarget = toFiniteNumber(options.configuredTarget);
  const target = configuredTarget
    ?? calcTargetFromInitial(
      baseline,
      options.improveDirectionVal,
      options.improveDirection,
    );
  return { baseline, target };
}

export function calcGaugeProgress(
  firstValue?: number | null,
  latestValue?: number | null,
  targetValue?: number | null,
) {
  if (firstValue == null || latestValue == null || targetValue == null) {
    return 0;
  }
  if (targetValue === firstValue) {
    return latestValue >= targetValue ? 100 : 0;
  }
  const percent = ((latestValue - firstValue) / (targetValue - firstValue)) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function getTestRecordStatusText(firstChangePercent?: number | null) {
  if (firstChangePercent == null) return '等待评估';
  if (firstChangePercent < 0) return '需关注';
  if (firstChangePercent >= 80) return '状态良好';
  if (firstChangePercent >= 50) return '持续改善中';
  return '状态良好';
}

function getImproveLabelFromPercent(firstChangePercent: number) {
    if (firstChangePercent < 0) return '需关注';
    return '持续改善中';
}

function areHealthTestRecordsDistinct(
    firstRecord?: { id?: number; testValue?: number | null } | null,
    latestRecord?: { id?: number; testValue?: number | null } | null,
) {
    if (!firstRecord || !latestRecord) return false;
    if (firstRecord.id != null && latestRecord.id != null) {
        return String(firstRecord.id) !== String(latestRecord.id);
    }
    const firstValue = firstRecord.testValue;
    const latestValue = latestRecord.testValue;
    return firstValue != null && latestValue != null && firstValue !== latestValue;
}

export function getImproveLabel(
    firstChangePercent?: number | null,
    context?: {
        firstRecord?: { id?: number; testValue?: number | null; firstRecord?: boolean } | null;
        latestRecord?: {
            id?: number;
            testValue?: number | null;
            firstRecord?: boolean;
            changeValue?: number | null;
        } | null;
        /** 记录总数；>=2 时不再显示「首次评估结果」 */
        recordTotal?: number | null;
    },
) {
    const { firstRecord, latestRecord, recordTotal } = context ?? {};

    // 未进行首次评估
    if (!firstRecord && !latestRecord) {
        return '请先进行首次评估';
    }

    const hasMultipleRecords = (recordTotal != null && recordTotal >= 2)
        || areHealthTestRecordsDistinct(firstRecord, latestRecord);

    // 仅首次评估（首末为同一条）
    if (!hasMultipleRecords) {
        return '首次评估结果';
    }

    // 相对首次评估：变好 / 变坏
    if (firstChangePercent != null && Number.isFinite(Number(firstChangePercent))) {
        return getImproveLabelFromPercent(Number(firstChangePercent));
    }

    const changeValue = latestRecord?.changeValue;
    if (changeValue != null && Number.isFinite(Number(changeValue))) {
        return Number(changeValue) < 0 ? '需关注' : '持续改善中';
    }

    return '持续改善中';
}

export function getRecordCountText(total?: number) {
  if (total == null || total <= 0) return '暂无记录';
  return `共${total}条记录`;
}

export function formatGaugeValue(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '--';
  const num = Number(value);
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(2)));
}

export function parseTestDurationSeconds(estimatedTime?: string) {
  const text = estimatedTime?.trim();
  if (!text) return 30;

  const hms = text.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) {
    return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
  }

  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*分/);
  if (minuteMatch) {
    return Math.round(Number(minuteMatch[1]) * 60);
  }

  const secondMatch = text.match(/(\d+(?:\.\d+)?)\s*秒/);
  if (secondMatch) {
    return Math.round(Number(secondMatch[1]));
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.round(numeric);
  }

  return 30;
}

export function formatCountdownTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export type TestTimerType = -1 | 0 | 1;

export function normalizeTimerType(value?: number | null): TestTimerType {
  if (value === -1 || value === 0 || value === 1) return value;
  return -1;
}

export function hasTestTimer(timerType?: number | null) {
  return normalizeTimerType(timerType) !== 0;
}

export function isCountdownTimer(timerType?: number | null) {
  return normalizeTimerType(timerType) === -1;
}

export function isForwardTimer(timerType?: number | null) {
  return normalizeTimerType(timerType) === 1;
}

export function resolveTestTimerSeconds(detail?: {
  timerSeconds?: number;
  estimatedTime?: string;
}) {
  if (detail?.timerSeconds != null && detail.timerSeconds > 0) {
    return Math.floor(detail.timerSeconds);
  }
  return parseTestDurationSeconds(detail?.estimatedTime);
}

/** 关节活动度 objValue 字段（与后端约定一致） */
export const JOINT_ROM_FIELDS = [
  { key: 'shoulderFlexion', label: '肩关节前屈' },
  { key: 'shoulderAbduction', label: '肩关节外展' },
  { key: 'elbowFlexion', label: '肘关节屈曲' },
  { key: 'hipFlexion', label: '髋关节屈曲' },
  { key: 'kneeFlexion', label: '膝关节屈曲' },
  { key: 'ankleDorsiflexion', label: '踝关节背屈' },
] as const;

export type JointRomFieldKey = (typeof JOINT_ROM_FIELDS)[number]['key'];
export type JointRomInputMap = Record<JointRomFieldKey, string>;
export type JointRomObjValue = Record<JointRomFieldKey, number>;

export function createEmptyJointRomInputs(): JointRomInputMap {
  return {
    shoulderFlexion: '',
    shoulderAbduction: '',
    elbowFlexion: '',
    hipFlexion: '',
    kneeFlexion: '',
    ankleDorsiflexion: '',
  };
}

/** 是否为关节活动度多值测试 */
export function isJointRomHealthTest(options?: {
  testName?: string | null;
  resultRecord?: string | null;
  hasJointRomTarget?: boolean;
}) {
  if (options?.hasJointRomTarget) return true;
  const name = options?.testName?.trim() ?? '';
  if (name.includes('关节活动度')) return true;
  const resultRecord = options?.resultRecord?.trim() ?? '';
  return JOINT_ROM_FIELDS.some(field => resultRecord.includes(field.label));
}

export function parseJointRomInputs(inputs: JointRomInputMap): JointRomObjValue | null {
  const result = {} as JointRomObjValue;
  for (const field of JOINT_ROM_FIELDS) {
    const raw = inputs[field.key]?.trim() ?? '';
    if (!raw) return null;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return null;
    result[field.key] = num;
  }
  return result;
}

export function calcJointRomAverage(objValue: JointRomObjValue) {
  const values = JOINT_ROM_FIELDS.map(field => objValue[field.key]);
  if (values.length === 0) return null;
  const sum = values.reduce((acc, item) => acc + item, 0);
  return Number((sum / values.length).toFixed(4));
}

export function resolveHealthTestUnit(detail?: { unit?: string | null; testName?: string | null } | null) {
  const unit = detail?.unit?.trim();
  if (unit && unit !== '-') return unit;
  if (isJointRomHealthTest({ testName: detail?.testName })) return '°';
  return unit || '次';
}

export function parseJointRomObjValue(
  objValue?: Record<string, number | string | null> | null,
): Partial<JointRomObjValue> {
  if (!objValue || typeof objValue !== 'object') return {};
  const result: Partial<JointRomObjValue> = {};
  for (const field of JOINT_ROM_FIELDS) {
    const raw = objValue[field.key];
    if (raw == null || raw === '') continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) continue;
    result[field.key] = num;
  }
  return result;
}

export type JointRomDisplayItem = {
  key: JointRomFieldKey;
  label: string;
  statusText: string;
  statusTone: 'good' | 'warn' | 'muted';
  baseline: number | null;
  current: number | null;
  target: number | null;
};

function getJointRomFieldStatus(
  firstValue: number | null,
  current: number | null,
  lowerBetter: boolean,
  hasMultipleRecords: boolean,
): { statusText: string; statusTone: JointRomDisplayItem['statusTone'] } {
  // 未录入过当前值 → 尚未评估
  if (current == null) {
    return { statusText: '请先进行首次评估', statusTone: 'muted' };
  }
  // 仅有一次评估记录
  if (!hasMultipleRecords) {
    return { statusText: '首次评估结果', statusTone: 'good' };
  }
  // 已有多次评估：按相对首次值判断（数值未变也算持续跟进）
  if (firstValue == null || firstValue === current) {
    return { statusText: '持续改善中', statusTone: 'good' };
  }
  const improved = lowerBetter ? current < firstValue : current > firstValue;
  if (improved) return { statusText: '持续改善中', statusTone: 'good' };
  return { statusText: '需关注', statusTone: 'warn' };
}

/** 关节活动度 6 项：初始 / 当前 / 目标 + 状态 */
export function buildJointRomDisplayItems(options: {
  jointRomTarget?: {
    shoulderFlexion?: { baseline?: number; target?: number };
    shoulderAbduction?: { baseline?: number; target?: number };
    elbowFlexion?: { baseline?: number; target?: number };
    hipFlexion?: { baseline?: number; target?: number };
    kneeFlexion?: { baseline?: number; target?: number };
    ankleDorsiflexion?: { baseline?: number; target?: number };
  } | null;
  firstObjValue?: Record<string, number | string | null> | null;
  latestObjValue?: Record<string, number | string | null> | null;
  improveDirectionVal?: number | null;
  improveDirection?: number | null;
  /** 是否已有至少两次测试记录 */
  hasMultipleRecords?: boolean;
}): JointRomDisplayItem[] {
  const firstValues = parseJointRomObjValue(options.firstObjValue);
  const latestValues = parseJointRomObjValue(options.latestObjValue);
  const lowerBetter = options.improveDirection === -1;
  const hasMultipleRecords = Boolean(options.hasMultipleRecords);

  return JOINT_ROM_FIELDS.map(field => {
    const pair = options.jointRomTarget?.[field.key];
    const configuredBaseline = pair?.baseline != null && Number.isFinite(Number(pair.baseline))
      ? Number(pair.baseline)
      : null;
    const configuredTarget = pair?.target != null && Number.isFinite(Number(pair.target))
      ? Number(pair.target)
      : null;
    const firstValue = firstValues[field.key] ?? null;
    const current = latestValues[field.key] ?? null;
    const baseline = configuredBaseline ?? firstValue;
    const target = configuredTarget
      ?? calcTargetFromInitial(baseline, options.improveDirectionVal, options.improveDirection);
    const { statusText, statusTone } = getJointRomFieldStatus(
      firstValue,
      current,
      lowerBetter,
      hasMultipleRecords,
    );

    return {
      key: field.key,
      label: field.label,
      statusText,
      statusTone,
      baseline,
      current,
      target,
    };
  });
}

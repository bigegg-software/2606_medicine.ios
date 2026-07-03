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
    if (firstChangePercent >= 80) return '接近目标达成';
    if (firstChangePercent >= 60) return '改善明显';
    if (firstChangePercent >= 40) return '改善情况良好';
    if (firstChangePercent >= 20) return '持续改善中';
    return '已开始改善';
}

function areHealthTestRecordsDistinct(
    firstRecord?: { id?: number; testValue?: number | null } | null,
    latestRecord?: { id?: number; testValue?: number | null } | null,
) {
    if (!firstRecord || !latestRecord) return false;
    if (firstRecord.id != null && latestRecord.id != null) {
        return firstRecord.id !== latestRecord.id;
    }
    const firstValue = firstRecord.testValue;
    const latestValue = latestRecord.testValue;
    return firstValue != null && latestValue != null && firstValue !== latestValue;
}

function isFirstAssessmentRecord(
    baselineRecord?: { id?: number; firstRecord?: boolean } | null,
    record?: { id?: number; firstRecord?: boolean } | null,
) {
    if (!record) return false;
    if (record.firstRecord === true) return true;
    if (baselineRecord?.id != null && record.id != null) {
        return baselineRecord.id === record.id;
    }
    return false;
}

export function getImproveLabel(
    firstChangePercent?: number | null,
    context?: {
        firstRecord?: { id?: number; testValue?: number | null; firstRecord?: boolean } | null;
        latestRecord?: { id?: number; testValue?: number | null; firstRecord?: boolean } | null;
    },
) {
    const { firstRecord, latestRecord } = context ?? {};

    if (isFirstAssessmentRecord(firstRecord, latestRecord) && firstChangePercent == null) {
        return '首次评估';
    }

    if (firstChangePercent != null) {
        return getImproveLabelFromPercent(firstChangePercent);
    }

    if (areHealthTestRecordsDistinct(firstRecord, latestRecord)) {
        return '已开始改善';
    }

    return '等待评估';
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

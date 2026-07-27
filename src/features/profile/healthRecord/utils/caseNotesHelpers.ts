import moment from 'moment';

/** 病例列表日期：2025.3.24（月日不补零） */
export function formatCaseNoteDate(recordDate?: string): string {
  if (!recordDate?.trim()) {
    return '—';
  }
  const m = moment(recordDate.trim(), ['YYYY-MM-DD', 'YYYYMMDD', 'YYYY/MM/DD', 'YYYY.M.D'], true);
  if (!m.isValid()) {
    return recordDate.trim();
  }
  return `${m.year()}.${m.month() + 1}.${m.date()}`;
}

const CASE_TYPE_COLORS: Record<string, string> = {
  复诊: '#EE9C44',
  门诊: '#6D925E',
  急诊: '#326AB2',
  住院: '#FB4550',
  体检: '#56A2D8',
  其他: '#9B90FE',
};

const DEFAULT_CASE_TYPE_COLOR = '#9B90FE';

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(ch => ch + ch).join('')
    : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 病例类型标签颜色（文字 / 背景 6% / 描边 30%） */
export function getCaseTypeTagColors(type?: string) {
  const color = CASE_TYPE_COLORS[type?.trim() ?? ''] ?? DEFAULT_CASE_TYPE_COLOR;
  return {
    color,
    backgroundColor: hexToRgba(color, 0.06),
    borderColor: hexToRgba(color, 0.3),
  };
}

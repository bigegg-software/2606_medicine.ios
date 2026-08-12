/** 列表全称如「Polar H10 0C9899900」→ 详情展示「Polar H10」 */
export function resolveEquipmentProductName(name?: string | null) {
  const raw = name?.trim() || '';
  if (!raw) return '--';
  const matched = raw.match(/^(Polar\s+H\d+)/i);
  return matched?.[1] ?? raw.split(/\s+/)[0] ?? raw;
}

/** 电量百分比限制在 0–100 */
export function clampBatteryPercent(value?: number | null) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

/**
 * 空电池图标内填充宽度
 * 内边距：上 2 / 右 5 / 下 2 / 左 2
 */
export function getBatteryFillWidth(
  percent?: number | null,
  iconWidth = 27,
  insetLeft = 2,
  insetRight = 5,
) {
  const maxFill = Math.max(0, iconWidth - insetLeft - insetRight);
  return (maxFill * clampBatteryPercent(percent)) / 100;
}

/** 电量填充色：≤10 红 / ≤20 橙 / >20 绿 */
export function getBatteryFillColor(percent?: number | null) {
  const value = clampBatteryPercent(percent);
  if (value <= 10) return '#FF3B30';
  if (value <= 20) return '#FF9500';
  return '#39BF56';
}

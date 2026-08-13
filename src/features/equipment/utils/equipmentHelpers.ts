/** 列表全称如「Polar H10 0C9899900」→ 详情展示「Polar H10」 */
export function resolveEquipmentProductName(name?: string | null) {
  const raw = name?.trim() || '';
  if (!raw) return '--';
  const matched = raw.match(/^(Polar\s+H\d+)/i);
  return matched?.[1] ?? raw.split(/\s+/)[0] ?? raw;
}

/** 电量百分比限制在 0–100；无值时默认 100 */
export function clampBatteryPercent(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return 100;
  return Math.max(0, Math.min(100, Math.round(Number(value))));
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

/** 我的页设备摘要文案 */
export function buildEquipmentSummaryText(options: {
  total: number;
  online: number;
}) {
  const total = Math.max(0, Math.round(Number(options.total) || 0));
  const online = Math.max(0, Math.min(total, Math.round(Number(options.online) || 0)));
  if (total <= 0) {
    return {
      title: '暂无已绑定设备',
      subtitle: '点击添加 Polar 等设备',
    };
  }
  return {
    title: online > 0 ? `${online}个设备在线` : '暂无设备在线',
    subtitle: `共绑定${total}个设备`,
  };
}

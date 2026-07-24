/** 积分展示：兼容后端科学计数法字符串（如 1E+1） */
export function formatSignRewardsTokens(raw?: string | number | null): string {
  if (raw == null || raw === '') {
    return '0';
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return String(raw);
  }
  if (Number.isInteger(n)) {
    return String(n);
  }
  return n.toFixed(2).replace(/\.?0+$/, '');
}

export function buildSignButtonLabel(rewardsHint?: string | number | null, signedToday?: boolean): string {
  if (signedToday) {
    return '已签到';
  }
  const tokens = formatSignRewardsTokens(rewardsHint ?? 10);
  return `签到+${tokens}`;
}

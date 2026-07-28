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

/** 北京时间今天 yyyy-MM-dd */
export function getBeijingDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** 根据服务器北京时间签到日期判断今日是否已签到 */
export function isSignedTodayByBjDate(signDateBj?: string | null): boolean {
  if (!signDateBj?.trim()) return false;
  const datePart = signDateBj.trim().slice(0, 10);
  return datePart === getBeijingDateKey();
}

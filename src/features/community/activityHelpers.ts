import moment from 'moment';

type ActivityLike = {
  activityName?: string;
};

export function toActivityId(value?: number | string | null) {
  if (value == null || value === '') return '';
  return String(value);
}

export function formatActivityStartTime(time?: string | null) {
  if (!time?.trim()) return '--';
  const target = moment(time);
  if (!target.isValid()) return time;
  return target.format('M月D日');
}

export function formatActivityDetailDateTime(time?: string | null) {
  if (!time?.trim()) return '--';
  const target = moment(time);
  if (!target.isValid()) return time;
  return target.format('YYYY/M/D HH:mm');
}

export function getActivityStatusText(status?: number, statusName?: string, isBm?: boolean) {
  // 生命周期优先，避免后端 statusName 仍为「去报名」等 CTA
  if (status === 2) return '已结束';
  if (status === 3 || status === 4) return '已取消';
  if (status === 1) return '进行中';

  if (status === 0) {
    if (isBm === true) return '已报名';
    if (isBm === false) return '未报名';
  }

  const name = statusName?.trim();
  if (name) {
    if (/去报名|立即报名|报名中/.test(name)) return isBm ? '已报名' : '未报名';
    if (/已报名/.test(name)) return '已报名';
    if (/进行中/.test(name)) return '进行中';
    if (/已结束/.test(name)) return '已结束';
    if (/已取消|已下架/.test(name)) return '已取消';
    return name;
  }

  if (isBm === true) return '已报名';
  if (isBm === false) return '未报名';
  return '--';
}

/** 封面活动生命周期状态：报名中 / 进行中 / 已结束 / 已取消 */
export function getActivityLifecycleStatusText(status?: number, statusName?: string) {
  if (status === 0) return '报名中';
  if (status === 1) return '进行中';
  if (status === 2) return '已结束';
  if (status === 3 || status === 4) return '已取消';

  const name = statusName?.trim();
  if (name) {
    if (/报名中|去报名|立即报名|未开始/.test(name)) return '报名中';
    if (/进行中/.test(name)) return '进行中';
    if (/已结束/.test(name)) return '已结束';
    if (/已取消|已下架/.test(name)) return '已取消';
  }
  return '';
}

export function getActivityLifecycleStatusStyle(status?: number, statusName?: string) {
  const label = getActivityLifecycleStatusText(status, statusName);
  if (label === '报名中') {
    return { bg: '#EE9C44', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  if (label === '进行中') {
    return { bg: '#6D925E', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  if (label === '已结束') {
    return { bg: '#FB4550', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  if (label === '已取消') {
    return { bg: '#E4E5E7', text: '#333333', dot: '#333333' };
  }
  return { bg: '#6D925E', text: '#FFFFFF', dot: '#FFFFFF' };
}

export function getActivityStatusTone(status?: number) {
  if (status === 1) return { bg: 'rgba(0,201,80,0.14)', text: '#00A63E' };
  if (status === 2) return { bg: 'rgba(153,153,153,0.14)', text: '#777777' };
  if (status === 3 || status === 4) return { bg: 'rgba(243,63,62,0.12)', text: '#D92D20' };
  return { bg: 'rgba(5,58,147,0.1)', text: '#053A93' };
}

export function splitDetailLines(text?: string | null) {
  if (!text?.trim()) return [];
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function stripHtmlWithLists(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseActivityDetailContent(html?: string | null) {
  if (!html?.trim()) {
    return { intro: '', sections: [] as Array<{ title: string; body: string }> };
  }

  const source = html.trim();
  const firstHeadingIndex = source.search(/<h[23][^>]*>/i);
  if (firstHeadingIndex < 0) {
    return { intro: stripHtmlWithLists(source), sections: [] };
  }

  const intro = firstHeadingIndex > 0 ? stripHtmlWithLists(source.slice(0, firstHeadingIndex)) : '';
  const sections: Array<{ title: string; body: string }> = [];
  const sectionRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23][^>]*>|$)/gi;
  let match = sectionRegex.exec(source);
  while (match) {
    const title = stripHtmlWithLists(match[1]);
    const body = stripHtmlWithLists(match[2]);
    if (title) {
      sections.push({ title, body });
    }
    match = sectionRegex.exec(source);
  }

  return {
    intro: intro || (sections.length === 0 ? stripHtmlWithLists(source) : ''),
    sections,
  };
}

export function getActivitySignupRemain(signupCount?: number | null, signupLimit?: number | null) {
  const count = Number(signupCount ?? 0);
  const limit = Number(signupLimit ?? 0);
  if (!Number.isFinite(limit) || limit <= 0) return null;
  return Math.max(0, limit - (Number.isFinite(count) ? count : 0));
}

export function canToggleActivitySignup(status?: number, isBm?: boolean) {
  if (status === 2 || status === 3 || status === 4) return false;
  if (status === 0) return true;
  return Boolean(isBm && status === 1);
}

/** 活动列表右上角状态标签文案与颜色 */
export function getActivityListStatusMeta(status?: number, isBm?: boolean) {
  if (status === 1) {
    return { label: '进行中', backgroundColor: '#6D925E', color: '#FFFFFF' };
  }
  if (status === 2) {
    return { label: '已结束', backgroundColor: '#FB4550', color: '#FFFFFF' };
  }
  if (status === 3 || status === 4) {
    return { label: '已取消', backgroundColor: '#E4E5E7', color: '#333333' };
  }
  if (isBm) {
    return { label: '已报名', backgroundColor: '#EE9C44', color: '#FFFFFF' };
  }
  return { label: '未报名', backgroundColor: '#EEF5EE', color: '#6D925E' };
}

export function formatActivitySignupCount(count?: number | null) {
  const value = Number(count ?? 0);
  if (!Number.isFinite(value) || value < 0) return '0人';
  return `${value}人`;
}

export function isNoticeActivity(item: ActivityLike, typeLabel?: string) {
  const name = item.activityName?.trim() ?? '';
  const label = typeLabel?.trim() ?? '';
  return label.includes('通知') || name.startsWith('通知');
}

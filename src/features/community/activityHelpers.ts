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
  const today = moment().startOf('day');
  const dayDiff = target.clone().startOf('day').diff(today, 'day');
  if (dayDiff === 0) return `今天 ${target.format('HH:mm')}`;
  if (dayDiff === 1) return `明天 ${target.format('HH:mm')}`;
  return target.format('M月D日 HH:mm');
}

export function formatActivityDetailDateTime(time?: string | null) {
  if (!time?.trim()) return '--';
  const target = moment(time);
  if (!target.isValid()) return time;
  return target.format('YYYY年M月D日 HH:mm');
}

export function getActivityStatusText(status?: number, statusName?: string) {
  if (statusName?.trim()) return statusName.trim();
  if (status === 0) return '报名中';
  if (status === 1) return '进行中';
  if (status === 2) return '已结束';
  if (status === 3) return '已取消';
  if (status === 4) return '已下架';
  return '--';
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

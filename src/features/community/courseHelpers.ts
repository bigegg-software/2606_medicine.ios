export function toCourseId(value?: number | string | null) {
  if (value == null || value === '') return '';
  return String(value);
}

export function stripHtmlText(html?: string | null) {
  if (!html?.trim()) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatCourseViewCount(count?: number | null) {
  const value = Number(count ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0人次观看';
  return `${value}人次观看`;
}

/** 课程详情观看中文案：2,150人正在看 */
export function formatCourseWatchingCount(count?: number | null) {
  const value = Number(count ?? 0);
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return `${safe.toLocaleString('en-US')}人正在看`;
}

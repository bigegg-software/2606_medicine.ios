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

/** 列表/详情点赞后的本地计数与状态 */
export function applyCourseLikeToggle<T extends { isLiked?: boolean; likeCount?: number }>(
  item: T,
  nextLiked: boolean,
): T {
  return {
    ...item,
    isLiked: nextLiked,
    likeCount: Math.max(0, Number(item.likeCount ?? 0) + (nextLiked ? 1 : -1)),
  };
}

/** 列表/详情收藏后的本地计数与状态 */
export function applyCourseFavoriteToggle<T extends {
  isFavorited?: boolean;
  favoriteCount?: number;
}>(item: T, nextFavorited: boolean): T {
  return {
    ...item,
    isFavorited: nextFavorited,
    favoriteCount: Math.max(0, Number(item.favoriteCount ?? 0) + (nextFavorited ? 1 : -1)),
  };
}

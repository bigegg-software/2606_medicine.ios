import type { CourseListParams } from '@/api/course';
import type { DictDataItem } from '@/api/dict';

export type FavoriteCourseTab = {
  label: string;
  /** 空字符串表示全部，不传 courseType */
  value: string;
};

export function buildFavoriteCourseTabs(items?: DictDataItem[] | null): FavoriteCourseTab[] {
  const dictTabs = (items ?? [])
    .map(item => ({
      label: item.dictLabel?.trim() || '',
      value: String(item.dictValue ?? '').trim(),
    }))
    .filter(item => item.label && item.value);
  return [{ label: '全部', value: '' }, ...dictTabs];
}

export function buildFavoriteListParams(options: {
  pageNum: number;
  pageSize: number;
  courseType?: string;
}): CourseListParams {
  const params: CourseListParams = {
    pageNum: options.pageNum,
    pageSize: options.pageSize,
  };
  const courseType = options.courseType?.trim();
  if (courseType) params.courseType = courseType;
  return params;
}

/** 解析分页 total（总记录数） */
export function parseFavoriteListTotal(res: { total?: number | string } | null | undefined): number {
  const total = Number(res?.total);
  if (!Number.isFinite(total) || total < 0) return 0;
  return Math.floor(total);
}

export function hasFavoriteMore(loadedCount: number, total: number): boolean {
  return loadedCount < total;
}

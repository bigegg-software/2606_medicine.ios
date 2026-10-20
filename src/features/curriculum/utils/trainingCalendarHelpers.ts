import { Dimensions } from 'react-native';

/** 与 scroll paddingHorizontal / calendarScrollContent padding 对齐 */
const PAGE_PAD_H = 12;
const STRIP_PAD_H = 4;

/** 一行可视 7 天（今天起） */
export const TRAINING_DATE_VISIBLE_COUNT = 7;
/** 日期间距（加大后刚好一屏 7 个，不再挤出第 8 个） */
export const TRAINING_DATE_CELL_GAP = 12;

const availableWidth =
  Dimensions.get('window').width - PAGE_PAD_H * 2 - STRIP_PAD_H * 2;

export const TRAINING_DATE_CELL_WIDTH = Math.floor(
  (availableWidth - TRAINING_DATE_CELL_GAP * (TRAINING_DATE_VISIBLE_COUNT - 1))
  / TRAINING_DATE_VISIBLE_COUNT,
);

export const TRAINING_DATE_STRIDE = TRAINING_DATE_CELL_WIDTH + TRAINING_DATE_CELL_GAP;

/** 滑动范围：仅今天及以后（不可往前滑到过去） */
export const TRAINING_DATE_PAST_COUNT = 0;
export const TRAINING_DATE_FUTURE_COUNT = 14;

/** 滚到指定下标，使该项落在可视区左侧 */
export function resolveTrainingDateStripScrollX(index: number) {
  if (index <= 0) return 0;
  return index * TRAINING_DATE_STRIDE;
}

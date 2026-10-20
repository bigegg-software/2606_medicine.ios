/** 与团课/私教 calendarCol / gap 一致（参考团课原周条宽度 38） */
export const TRAINING_DATE_CELL_WIDTH = 38;
export const TRAINING_DATE_CELL_GAP = 8;
export const TRAINING_DATE_STRIDE = TRAINING_DATE_CELL_WIDTH + TRAINING_DATE_CELL_GAP;

/** 滑动范围：今天前一周 + 今天 + 往后两周 */
export const TRAINING_DATE_PAST_COUNT = 7;
export const TRAINING_DATE_FUTURE_COUNT = 14;

/** 滚到指定下标，使该项落在可视区左侧 */
export function resolveTrainingDateStripScrollX(index: number) {
  if (index <= 0) return 0;
  return index * TRAINING_DATE_STRIDE;
}

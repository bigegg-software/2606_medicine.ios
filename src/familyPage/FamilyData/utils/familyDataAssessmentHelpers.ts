import type { ImageSourcePropType } from 'react-native';
import {
  getUserQuestionFrontList,
  getUserQuestionNewList,
} from '@/api/questionTemplate';
import {
  getUserQuestionListRecords,
  normalizeQuestionnaireType,
  QUESTIONNAIRE_TITLES,
  sortRecordsByTime,
  toAssessmentSummary,
  toHistoryItem,
  type HistoryItem,
  type StatusStyleKey,
} from '@/src/features/profile/questionnaire/utils/helpers';
import type { FamilyAssessmentItem } from './familyDataHelpers';

const RECENT_ASSESSMENT_LIMIT = 3;
const HISTORY_PAGE_SIZE = 20;

const FAMILY_RISK_GAUGE_ICONS: Record<StatusStyleKey, ImageSourcePropType> = {
  rowStatus: require('@/assets/family/data/risk_low.png'),
  rowStatusWarn: require('@/assets/family/data/risk_warn.png'),
  rowStatusOrange: require('@/assets/family/data/risk_orange.png'),
  rowStatusError: require('@/assets/family/data/risk_high.png'),
};

/** 家人评估结果页仪表盘图标 */
export function getFamilyRiskGaugeIcon(statusStyle?: StatusStyleKey): ImageSourcePropType {
  return FAMILY_RISK_GAUGE_ICONS[statusStyle ?? 'rowStatus'];
}

export function emptyFamilyAssessmentItems(): FamilyAssessmentItem[] {
  return [];
}

function toFamilyAssessmentItem(
  record: Parameters<typeof toAssessmentSummary>[0],
  index: number,
): FamilyAssessmentItem | null {
  const type = normalizeQuestionnaireType(record.type);
  if (type == null || QUESTIONNAIRE_TITLES[type] == null) return null;

  const summary = toAssessmentSummary(record);
  const result = summary?.result?.trim();
  const date = summary?.date?.trim();
  let subtitle = '--';
  if (result && date) subtitle = `${result}（${date}）`;
  else if (result) subtitle = result;
  else if (date) subtitle = date;

  return {
    key: record.id != null ? String(record.id) : `assessment-${index}`,
    title: QUESTIONNAIRE_TITLES[type],
    subtitle,
    recordId: record.id != null ? String(record.id) : undefined,
    type,
  };
}

/** 拉取指定家人最近答过的问卷记录（不区分类型，最多 3 条） */
export async function loadFamilyAssessmentItems(
  patientUserId: string,
): Promise<FamilyAssessmentItem[]> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyAssessmentItems();

  try {
    const res = await getUserQuestionNewList({ patientUserId: id });
    const sorted = sortRecordsByTime(getUserQuestionListRecords(res));

    const items: FamilyAssessmentItem[] = [];
    for (let i = 0; i < sorted.length; i += 1) {
      if (items.length >= RECENT_ASSESSMENT_LIMIT) break;
      const mapped = toFamilyAssessmentItem(sorted[i], i);
      if (mapped) items.push(mapped);
    }
    return items;
  } catch {
    return emptyFamilyAssessmentItems();
  }
}

/** 拉取指定家人评估问卷历史（不区分类型） */
export async function loadFamilyAssessmentHistory(
  patientUserId: string,
): Promise<HistoryItem[]> {
  const id = String(patientUserId).trim();
  if (!id) return [];

  try {
    const res = await getUserQuestionFrontList(
      { pageSize: HISTORY_PAGE_SIZE, pageNum: 1 },
      { patientUserId: id },
    );
    return sortRecordsByTime(getUserQuestionListRecords(res))
      .map(toHistoryItem)
      .filter((item): item is HistoryItem => Boolean(item));
  } catch {
    return [];
  }
}

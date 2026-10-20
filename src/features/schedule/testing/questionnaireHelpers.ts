import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';
import {
  formatEq5dScore,
  getScoreLevel,
  getScoreLevelProgressPercent,
  PROGRESS_COLORS,
  QUESTIONNAIRE_CONFIG,
  type ScoreLevel,
} from '@/src/features/profile/questionnaire/utils/helpers';

export { QUESTIONNAIRE_CONFIG };

/** EQ-5D 最后一题（自我健康评分）的答案，0-100 */
export function getEq5dLastQuestionAnswer(record?: UserQuestionRecord | null) {
  const items = record?.questionsAnswer;
  if (!items?.length) return null;
  const lastItem = items[items.length - 1];
  const answer = lastItem?.answers?.[0]?.answer?.trim();
  return answer || null;
}

export function parseEq5dSelfHealthScore(record?: UserQuestionRecord | null) {
  const answer = getEq5dLastQuestionAnswer(record);
  if (answer == null) return null;
  const num = Number(answer);
  if (!Number.isFinite(num)) return null;
  return Math.min(100, Math.max(0, Math.round(num)));
}

export function formatEq5dSelfHealthScore(record?: UserQuestionRecord | null) {
  const score = parseEq5dSelfHealthScore(record);
  if (score == null) return '--';
  return score;
}

export function formatQuestionnaireScore(
  type: QuestionnaireType,
  score?: number | null,
) {
  if (score == null || Number.isNaN(Number(score))) return '--';
  if (type === 3) return formatEq5dScore(Number(score));
  return String(Number(score));
}

export function formatQuestionnaireScoreLevel(
  type: QuestionnaireType,
  score?: number | null,
) {
  if (score == null || Number.isNaN(Number(score))) return '--';
  return getScoreLevel(type, Number(score)).result;
}

/**
 * 仪表盘用短文案：有红旗 / 无红旗
 */
export function formatQuestionnaireGaugeLevel(
  type: QuestionnaireType,
  score?: number | null,
) {
  if (score == null || Number.isNaN(Number(score))) return '--';
  if (type === 4) {
    return Number(score) > 0 ? '有红旗' : '无红旗';
  }
  return formatQuestionnaireScoreLevel(type, score);
}

export function resolveQuestionnaireGaugeCenterLabel(type?: QuestionnaireType | null) {
  if (type === 4) return '当前红旗筛查';
  return '当前健康指数测评';
}

export function resolveQuestionnaireRecordTitle(type?: QuestionnaireType | null) {
  if (type === 4) return '健康信息评估';
  return '健康指数测评';
}

/** 从记录取分值；缺省时按选项分回算（避免列表未回填 score 时标签变成 --） */
export function resolveQuestionnaireRecordScore(record?: UserQuestionRecord | null): number | null {
  if (!record) return null;
  if (record.score != null && Number.isFinite(Number(record.score))) {
    return Number(record.score);
  }
  const items = record.questionsAnswer;
  if (!items?.length) return null;
  let total = 0;
  let counted = false;
  for (const item of items) {
    const options = item.options ?? [];
    for (const ans of item.answers ?? []) {
      const raw = ans.answer?.trim();
      if (!raw) continue;
      const parts = raw.includes(',') ? raw.split(',') : [raw];
      for (const part of parts) {
        const index = Number(part);
        if (!Number.isFinite(index)) continue;
        counted = true;
        total += Number(options[index]?.score ?? 0);
      }
    }
  }
  return counted ? total : null;
}

/** 健康信息评估记录右侧标签：有红旗 / 无红旗 */
export function formatHealthInfoRecordTag(score?: number | null) {
  if (score == null || Number.isNaN(Number(score))) return '--';
  return Number(score) > 0 ? '有红旗' : '无红旗';
}

export function getQuestionnaireScoreLevel(
  type: QuestionnaireType,
  score?: number | null,
): ScoreLevel | null {
  if (score == null || Number.isNaN(Number(score))) return null;
  return getScoreLevel(type, Number(score));
}

export function getQuestionnaireTierProgress(
  type: QuestionnaireType,
  score?: number | null,
) {
  if (score == null || Number.isNaN(Number(score))) return null;
  return getScoreLevelProgressPercent(type, Number(score));
}

export function getQuestionnaireStatusColors(scoreLevel?: ScoreLevel | null) {
  const key = scoreLevel?.statusStyle ?? 'rowStatus';
  return PROGRESS_COLORS[key];
}

const BEST_SCORE_BY_TYPE: Record<QuestionnaireType, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 1,
  /** 用户健康信息：无红旗 */
  4: 0,
};

export function getQuestionnaireBestTarget(type: QuestionnaireType) {
  const bestScore = BEST_SCORE_BY_TYPE[type] ?? 0;
  const scoreLevel = getScoreLevel(type, bestScore);
  return {
    label: scoreLevel.result,
    tierProgress: getScoreLevelProgressPercent(type, bestScore),
    scoreLevel,
  };
}

export function getQuestionnaireImproveLabel(
  type: QuestionnaireType,
  record?: UserQuestionRecord | null,
  firstRecord?: UserQuestionRecord | null,
) {
  if (!record) return '等待评估';
  if (!firstRecord || record.id === firstRecord.id) return '首次评估';

  const firstScore = resolveQuestionnaireRecordScore(firstRecord);
  const score = resolveQuestionnaireRecordScore(record);
  if (firstScore == null || score == null) {
    return '等待评估';
  }

  const delta = score - firstScore;
  const improved = type === 3 ? delta > 0 : delta < 0;
  const worsened = type === 3 ? delta < 0 : delta > 0;
  if (improved) return '持续改善中';
  if (worsened) return '需关注';
  return '状态稳定';
}

export function hasQuestionnaireScoreImproved(
  type: QuestionnaireType,
  record?: UserQuestionRecord | null,
  firstRecord?: UserQuestionRecord | null,
) {
  if (!record || !firstRecord || record.id === firstRecord.id) return false;
  const firstScore = resolveQuestionnaireRecordScore(firstRecord);
  const score = resolveQuestionnaireRecordScore(record);
  if (firstScore == null || score == null) return false;
  if (type === 3) return score > firstScore;
  return score < firstScore;
}

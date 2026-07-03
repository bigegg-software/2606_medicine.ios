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
};

export function getQuestionnaireBestTarget(type: QuestionnaireType) {
  const bestScore = BEST_SCORE_BY_TYPE[type];
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

  const firstScore = firstRecord.score;
  const score = record.score;
  if (firstScore == null || score == null || Number.isNaN(Number(firstScore)) || Number.isNaN(Number(score))) {
    return '等待评估';
  }

  const delta = Number(score) - Number(firstScore);
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
  const firstScore = firstRecord.score;
  const score = record.score;
  if (firstScore == null || score == null) return false;
  if (type === 3) return Number(score) > Number(firstScore);
  return Number(score) < Number(firstScore);
}

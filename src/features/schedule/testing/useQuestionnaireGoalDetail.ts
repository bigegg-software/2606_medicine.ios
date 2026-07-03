import { useCallback, useEffect, useState } from 'react';
import { getHealthGoalInfo, type HealthGoalInfo } from '@/api/healthGoal';
import type { QuestionnaireType } from '@/api/questionTemplate';
import { QUESTIONNAIRE_TITLES } from '@/src/features/profile/questionnaire/utils/helpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

function resolveQuestionnaireType(goalInfo?: HealthGoalInfo | null): QuestionnaireType | undefined {
  if (goalInfo?.assessmentType?.trim() !== 'question_type') return undefined;
  const parsed = Number(goalInfo.assessmentValue);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 3) return undefined;
  return parsed as QuestionnaireType;
}

export function useQuestionnaireGoalDetail(healthGoalId?: string) {
  const [goalInfo, setGoalInfo] = useState<HealthGoalInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(healthGoalId));

  const load = useCallback(async () => {
    if (!healthGoalId) {
      setGoalInfo(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getHealthGoalInfo(healthGoalId);
      if (!isResourceApiOk(res)) {
        setGoalInfo(null);
        return;
      }
      setGoalInfo(apiResourceData(res) ?? null);
    } catch {
      setGoalInfo(null);
    } finally {
      setLoading(false);
    }
  }, [healthGoalId]);

  useEffect(() => {
    load();
  }, [load]);

  const questionnaireType = resolveQuestionnaireType(goalInfo);
  const title = goalInfo?.goalName?.trim()
    || goalInfo?.assessmentValueName?.trim()
    || (questionnaireType != null ? QUESTIONNAIRE_TITLES[questionnaireType] : '评估问卷');

  return {
    goalInfo,
    questionnaireType,
    title,
    loading,
    reload: load,
  };
}

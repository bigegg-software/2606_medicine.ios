import { useCallback, useEffect, useState } from 'react';
import { getHealthGoalInfo } from '@/api/healthGoal';
import { getHealthTestItemInfo, type HealthTestItemInfo } from '@/api/healthTestItem';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

function resolveHealthTestItemId(
  goalInfo?: { assessmentType?: string; assessmentValue?: string; healthTestItemVo?: { healthTestItemId?: number } },
) {
  const fromVo = goalInfo?.healthTestItemVo?.healthTestItemId;
  if (fromVo != null) return fromVo;
  if (goalInfo?.assessmentType === 'sys_health_test_item' && goalInfo.assessmentValue) {
    const parsed = Number(goalInfo.assessmentValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function useHealthTestDetailByGoalId(healthGoalId?: string) {
  const [detail, setDetail] = useState<HealthTestItemInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(healthGoalId));

  const load = useCallback(async () => {
    if (!healthGoalId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const goalRes = await getHealthGoalInfo(healthGoalId);
      if (!isResourceApiOk(goalRes)) {
        setDetail(null);
        return;
      }
      const goalInfo = apiResourceData(goalRes);
      const healthTestItemId = resolveHealthTestItemId(goalInfo);
      if (healthTestItemId == null) {
        setDetail(goalInfo?.healthTestItemVo ?? null);
        return;
      }

      const testRes = await getHealthTestItemInfo(healthTestItemId);
      if (!isResourceApiOk(testRes)) {
        setDetail(goalInfo?.healthTestItemVo ?? null);
        return;
      }
      setDetail(apiResourceData(testRes) ?? goalInfo?.healthTestItemVo ?? null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [healthGoalId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    detail,
    loading,
    healthTestItemId: detail?.healthTestItemId,
    reload: load,
  };
}

export function useHealthTestDetailByItemId(healthTestItemId?: string) {
  const [detail, setDetail] = useState<HealthTestItemInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(healthTestItemId));

  const load = useCallback(async () => {
    if (!healthTestItemId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getHealthTestItemInfo(healthTestItemId);

      if (!isResourceApiOk(res)) {
        setDetail(null);
        return;
      }
      setDetail(apiResourceData(res) ?? null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [healthTestItemId]);

  useEffect(() => {
    load();
  }, [load]);

  return { detail, loading, reload: load };
}

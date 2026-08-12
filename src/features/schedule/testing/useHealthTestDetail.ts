import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getHealthTestItemInfo, type HealthTestItemInfo } from '@/api/healthTestItem';
import type { HealthGoalTarget } from '@/api/healthGoal';
import { fetchInUsePrescription } from '@/store/actions/prescription';
import type { AppDispatch, RootState } from '@/store/store';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

function resolveHealthTestItemId(goalTarget?: HealthGoalTarget | null) {
  const goalInfo = goalTarget?.healthGoalVo;
  const fromVo = goalInfo?.healthTestItemVo?.healthTestItemId;
  if (fromVo != null) return fromVo;
  if (goalInfo?.assessmentType === 'sys_health_test_item' && goalInfo.assessmentValue) {
    const parsed = Number(goalInfo.assessmentValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function useHealthTestDetailByGoalId(healthGoalId?: string) {
  const dispatch = useDispatch<AppDispatch>();
  const prescription = useSelector((state: RootState) => state.prescription.inUse);
  const [detail, setDetail] = useState<HealthTestItemInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(healthGoalId));

  const goalTarget = useMemo(() => {
    if (!healthGoalId) return null;
    return prescription?.healthGoalTargetList?.find(
      item => String(item.healthGoalId) === String(healthGoalId),
    ) ?? null;
  }, [healthGoalId, prescription?.healthGoalTargetList]);

  const healthTestItemId = useMemo(
    () => resolveHealthTestItemId(goalTarget),
    [goalTarget],
  );

  const load = useCallback(async () => {
    if (!healthGoalId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let currentTarget = goalTarget;
      if (!currentTarget) {
        const inUse = await dispatch(fetchInUsePrescription());
        currentTarget = inUse?.healthGoalTargetList?.find(
          item => String(item.healthGoalId) === String(healthGoalId),
        ) ?? null;
      }

      const fallbackDetail = currentTarget?.healthGoalVo?.healthTestItemVo ?? null;
      const itemId = resolveHealthTestItemId(currentTarget);
      if (itemId == null) {
        setDetail(fallbackDetail);
        return;
      }

      const testRes = await getHealthTestItemInfo(itemId);
      if (!isResourceApiOk(testRes)) {
        setDetail(fallbackDetail);
        return;
      }
      setDetail(apiResourceData(testRes) ?? fallbackDetail);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [dispatch, goalTarget, healthGoalId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    detail,
    loading,
    goalTarget,
    healthTestItemId: detail?.healthTestItemId ?? healthTestItemId,
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

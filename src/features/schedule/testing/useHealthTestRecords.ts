import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  listHealthTestRecords,
  pickFirstAndLatestHealthTestRecords,
  type ExHealthTestRecord,
  type FirstAndLatestHealthTestRecord,
} from '@/api/exHealthTestRecord';
import type { HealthGoalTarget } from '@/api/healthGoal';
import { fetchInUsePrescription } from '@/store/actions/prescription';
import type { AppDispatch, RootState } from '@/store/store';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

function sortHealthTestRecordsByTime(records: ExHealthTestRecord[]) {
  return [...records].sort((a, b) => {
    const timeA = new Date(a.createTime ?? 0).getTime();
    const timeB = new Date(b.createTime ?? 0).getTime();
    return timeB - timeA;
  });
}

export function useHealthTestRecords(options: {
  healthGoalId?: string;
  healthTestItemId?: number | string;
  userId?: number | string;
}) {
  const { healthGoalId, healthTestItemId, userId } = options;
  const dispatch = useDispatch<AppDispatch>();
  const prescription = useSelector((state: RootState) => state.prescription.inUse);
  const [records, setRecords] = useState<FirstAndLatestHealthTestRecord | null>(null);
  const [recordTotal, setRecordTotal] = useState(0);
  const [latestTwoRecords, setLatestTwoRecords] = useState<ExHealthTestRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const goalTarget = useMemo(() => {
    if (!healthGoalId) return null;
    return prescription?.healthGoalTargetList?.find(
      item => String(item.healthGoalId) === String(healthGoalId),
    ) ?? null;
  }, [healthGoalId, prescription?.healthGoalTargetList]);

  const exPatientRuleId = prescription?.exPatientRuleId != null
    ? String(prescription.exPatientRuleId)
    : undefined;

  const load = useCallback(async () => {
    if (!healthTestItemId) {
      setRecords(null);
      setRecordTotal(0);
      setLatestTwoRecords([]);
      return;
    }

    setLoading(true);
    try {
      let current = prescription;
      if (!current?.startDate || !current?.endDate) {
        current = await dispatch(fetchInUsePrescription()) ?? null;
      }

      const startDate = current?.startDate?.trim();
      const endDate = current?.endDate?.trim();
      if (!startDate || !endDate) {
        setRecords(null);
        setRecordTotal(0);
        setLatestTwoRecords([]);
        return;
      }

      // 按处方周期 list；首次/最新从 list 推导（教练代录可能无 exPatientRuleId）
      const listRes = await listHealthTestRecords({
        startDate,
        endDate,
        healthTestItemId: String(healthTestItemId),
        userId: userId != null ? String(userId) : undefined,
        pageNum: 1,
        pageSize: 500,
      });

      if (!isResourceApiOk(listRes)) {
        setRecords(null);
        setRecordTotal(0);
        setLatestTwoRecords([]);
        return;
      }

      const rows = getResourceRows<ExHealthTestRecord>(listRes as any);
      const total = Number((listRes as { total?: number }).total ?? rows.length);
      const sortedDesc = sortHealthTestRecordsByTime(rows);

      setRecords(pickFirstAndLatestHealthTestRecords(rows));
      setRecordTotal(Number.isFinite(total) ? total : rows.length);
      setLatestTwoRecords(sortedDesc.slice(0, 2));
    } catch {
      setRecords(null);
      setRecordTotal(0);
      setLatestTwoRecords([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, healthTestItemId, prescription, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    records,
    recordTotal,
    latestTwoRecords,
    goalTarget: goalTarget as HealthGoalTarget | null,
    improveDirectionVal: goalTarget?.improveDirectionVal,
    configuredBaseline: goalTarget?.healthTest?.baseline,
    configuredTarget: goalTarget?.healthTest?.target,
    exPatientRuleId,
    loading,
    reload: load,
  };
}

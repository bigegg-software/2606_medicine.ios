import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  listHealthTestRecords,
  queryFirstAndLatestHealthTestRecord,
  type ExHealthTestRecord,
  type FirstAndLatestHealthTestRecord,
} from '@/api/exHealthTestRecord';
import type { HealthGoalTarget } from '@/api/healthGoal';
import { fetchInUsePrescription } from '@/store/actions/prescription';
import type { AppDispatch, RootState } from '@/store/store';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

function sortHealthTestRecordsByTime(records: ExHealthTestRecord[]) {
  return [...records].sort((a, b) => {
    const timeA = new Date(a.createTime ?? 0).getTime();
    const timeB = new Date(b.createTime ?? 0).getTime();
    return timeB - timeA;
  });
}

export function useHealthTestRecords(options: {
  healthGoalId?: string;
  healthTestItemId?: number;
  userId?: number;
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
      if (!current?.exPatientRuleId) {
        current = await dispatch(fetchInUsePrescription()) ?? null;
      }

      const ruleId = current?.exPatientRuleId;
      if (ruleId == null) {
        setRecords(null);
        setRecordTotal(0);
        setLatestTwoRecords([]);
        return;
      }

      const queryParams = {
        exPatientRuleId: ruleId,
        healthTestItemId,
        userId,
      };

      const [firstLatestRes, listRes] = await Promise.all([
        queryFirstAndLatestHealthTestRecord(queryParams),
        listHealthTestRecords({ ...queryParams, pageNum: 1, pageSize: 2 }),
      ]);

      if (isResourceApiOk(firstLatestRes)) {
        setRecords(apiResourceData<FirstAndLatestHealthTestRecord>(firstLatestRes as any) ?? null);
      } else {
        setRecords(null);
      }

      if (isResourceApiOk(listRes)) {
        const total = Number((listRes as { total?: number }).total ?? 0);
        const rows = sortHealthTestRecordsByTime(getResourceRows(listRes as any)).slice(0, 2);
        setRecordTotal(Number.isFinite(total) ? total : rows.length);
        setLatestTwoRecords(rows);
      } else {
        setRecordTotal(0);
        setLatestTwoRecords([]);
      }
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

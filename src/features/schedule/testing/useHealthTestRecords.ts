import { useCallback, useEffect, useState } from 'react';
import {
  listHealthTestRecords,
  queryFirstAndLatestHealthTestRecord,
  type ExHealthTestRecord,
  type FirstAndLatestHealthTestRecord,
} from '@/api/exHealthTestRecord';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
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
  const [records, setRecords] = useState<FirstAndLatestHealthTestRecord | null>(null);
  const [recordTotal, setRecordTotal] = useState(0);
  const [latestTwoRecords, setLatestTwoRecords] = useState<ExHealthTestRecord[]>([]);
  const [exPatientRuleId, setExPatientRuleId] = useState<string | undefined>();
  const [improveDirectionVal, setImproveDirectionVal] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!healthTestItemId) {
      setRecords(null);
      setRecordTotal(0);
      setLatestTwoRecords([]);
      setExPatientRuleId(undefined);
      setImproveDirectionVal(undefined);
      return;
    }

    setLoading(true);
    try {
      const prescriptionRes = await getInUseExPatientRuleInfo();
      if (!isResourceApiOk(prescriptionRes)) {
        setRecords(null);
        setRecordTotal(0);
        setLatestTwoRecords([]);
        return;
      }

      const prescription = apiResourceData<InUseExPatientRule>(prescriptionRes as any);
      const ruleId = prescription?.exPatientRuleId;
      if (ruleId == null) {
        setRecords(null);
        setRecordTotal(0);
        setLatestTwoRecords([]);
        return;
      }
      setExPatientRuleId(String(ruleId));

      if (healthGoalId) {
        const target = prescription?.healthGoalTargetList?.find(
          item => String(item.healthGoalId) === String(healthGoalId),
        );
        setImproveDirectionVal(target?.improveDirectionVal);
      } else {
        setImproveDirectionVal(undefined);
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
  }, [healthGoalId, healthTestItemId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    records,
    recordTotal,
    latestTwoRecords,
    improveDirectionVal,
    exPatientRuleId,
    loading,
    reload: load,
  };
}

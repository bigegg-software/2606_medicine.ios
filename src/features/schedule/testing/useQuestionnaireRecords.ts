import { useCallback, useEffect, useState } from 'react';
import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';
import {
  listExUserQuestions,
  pickFirstAndLatestUserQuestionRecords,
  queryFirstAndLatestExUserQuestion,
  type FirstAndLatestUserQuestionRecord,
} from '@/api/exUserQuestion';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

function sortQuestionnaireRecordsByTime(records: UserQuestionRecord[]) {
  return [...records].sort((a, b) => {
    const timeA = new Date(a.createTime ?? a.updateTime ?? 0).getTime();
    const timeB = new Date(b.createTime ?? b.updateTime ?? 0).getTime();
    return timeB - timeA;
  });
}

export function useQuestionnaireRecords(options: {
  healthGoalId?: string;
  questionnaireType?: QuestionnaireType;
  userId?: number | string;
}) {
  const { healthGoalId, questionnaireType, userId } = options;
  const [records, setRecords] = useState<FirstAndLatestUserQuestionRecord | null>(null);
  const [recordTotal, setRecordTotal] = useState(0);
  const [latestTwoRecords, setLatestTwoRecords] = useState<UserQuestionRecord[]>([]);
  const [exPatientRuleId, setExPatientRuleId] = useState<string | undefined>();
  const [improveDirectionVal, setImproveDirectionVal] = useState<number | undefined>();
  const [improveDirection, setImproveDirection] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (questionnaireType == null) {
      setRecords(null);
      setRecordTotal(0);
      setLatestTwoRecords([]);
      setExPatientRuleId(undefined);
      setImproveDirectionVal(undefined);
      setImproveDirection(undefined);
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
        setImproveDirection(target?.healthGoalVo?.healthTestItemVo?.improveDirection);
      } else {
        setImproveDirectionVal(undefined);
        setImproveDirection(undefined);
      }

      const queryParams = {
        exPatientRuleId: String(ruleId),
        type: questionnaireType,
        ...(userId != null ? { userId: String(userId) } : {}),
      };

      const [firstLatestRes, listRes] = await Promise.all([
        queryFirstAndLatestExUserQuestion(queryParams),
        listExUserQuestions({ ...queryParams, pageNum: 1, pageSize: 500 }),
      ]);

      const rows = isResourceApiOk(listRes as any)
        ? sortQuestionnaireRecordsByTime(getResourceRows(listRes as any))
        : [];
      const fromList = pickFirstAndLatestUserQuestionRecords(rows);
      const fromApi = isResourceApiOk(firstLatestRes)
        ? (apiResourceData<FirstAndLatestUserQuestionRecord>(firstLatestRes as any) ?? null)
        : null;

      // 优先接口首次/最新；缺失时用 list 最早/最晚补齐（保证仪表盘「初始」有值）
      setRecords({
        firstRecord: fromApi?.firstRecord ?? fromList.firstRecord ?? null,
        latestRecord: fromApi?.latestRecord ?? fromList.latestRecord ?? null,
      });

      if (rows.length > 0) {
        const total = Number((listRes as { total?: number }).total ?? 0);
        setRecordTotal(Number.isFinite(total) && total > 0 ? total : rows.length);
        setLatestTwoRecords(rows.slice(0, 2));
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
  }, [healthGoalId, questionnaireType, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    records,
    recordTotal,
    latestTwoRecords,
    improveDirectionVal,
    improveDirection,
    exPatientRuleId,
    loading,
    reload: load,
  };
}

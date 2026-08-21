/** 历史计划进入运动处方：指定处方只读，不可训练/播放 */
export function getHistoryPlanExerciseParams(exPatientRuleId: string | number) {
  return {
    readOnly: true as const,
    exPatientRuleId: String(exPatientRuleId),
  };
}

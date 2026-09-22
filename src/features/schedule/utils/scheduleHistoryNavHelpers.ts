/** 历史计划进入运动处方：指定处方只读，不可训练/播放 */
export function getHistoryPlanExerciseParams(exPatientRuleId: string | number) {
  return {
    readOnly: true as const,
    exPatientRuleId: String(exPatientRuleId),
  };
}

/** 历史计划「处方详情」：仅展示运动处方内容 */
export function getHistoryPlanPrescriptionParams(exPatientRuleId: string | number) {
  return {
    readOnly: true as const,
    exPatientRuleId: String(exPatientRuleId),
    prescriptionOnly: true as const,
  };
}

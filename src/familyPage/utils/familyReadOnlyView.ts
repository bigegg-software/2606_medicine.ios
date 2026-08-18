/** 家人只读查看处方/营养等页的通用路由参数 */
export type FamilyReadOnlyViewParams = {
  readOnly?: boolean;
  patientUserId?: string;
  /** 关系文案，如「父亲」，用于右上角标签 */
  relationLabel?: string;
  /** 家人显示名（备注/患者名），无处方时也要用 */
  displayName?: string;
};

export function resolveFamilyReadOnlyView(
  params?: FamilyReadOnlyViewParams | null,
): {
  readOnly: boolean;
  patientUserId?: string;
  relationLabel: string;
  displayName?: string;
  /** 向二级页透传；本人可写时为 undefined */
  viewNavParams: FamilyReadOnlyViewParams | undefined;
} {
  const patientUserId =
    params?.patientUserId != null ? String(params.patientUserId).trim() : '';
  const readOnly = Boolean(params?.readOnly) || Boolean(patientUserId);
  const relationLabel = params?.relationLabel?.trim() || '家人';
  const displayName = params?.displayName?.trim() || undefined;
  const id = patientUserId || undefined;
  const viewNavParams: FamilyReadOnlyViewParams | undefined = readOnly
    ? {
        readOnly: true,
        ...(id ? { patientUserId: id } : {}),
        relationLabel,
        ...(displayName ? { displayName } : {}),
      }
    : undefined;
  return {
    readOnly,
    patientUserId: id,
    relationLabel,
    displayName,
    viewNavParams,
  };
}

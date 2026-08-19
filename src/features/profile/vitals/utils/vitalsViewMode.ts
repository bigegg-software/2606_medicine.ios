import type { RootStackParamList } from '@/route/router';

/** 体征相关页共用：家人只读查看 */
export type VitalsViewParams = {
  readOnly?: boolean;
  patientUserId?: string;
  relationLabel?: string;
};

export type VitalsNavExtras = VitalsViewParams;

/** 从路由 params 解析查看模式 */
export function resolveVitalsViewMode(
  params?: VitalsViewParams | null,
): {
  readOnly: boolean;
  patientUserId?: string;
  relationLabel: string;
  /** 向子页面透传的参数（无只读/家人时为 undefined） */
  viewNavParams: VitalsViewParams | undefined;
} {
  const patientUserId =
    params?.patientUserId != null ? String(params.patientUserId).trim() : '';
  const readOnly = Boolean(params?.readOnly);
  const relationLabel = params?.relationLabel?.trim() || '家人';
  const id = patientUserId || undefined;
  const viewNavParams =
    readOnly || id
      ? {
          ...(readOnly ? { readOnly: true } : {}),
          ...(id ? { patientUserId: id } : {}),
        }
      : undefined;
  return { readOnly, patientUserId: id, relationLabel, viewNavParams };
}

/** 合并体征详情/全部记录导航参数 */
export function withVitalsViewParams<T extends Record<string, unknown>>(
  base: T,
  viewNavParams?: VitalsViewParams,
): T & VitalsViewParams {
  if (!viewNavParams) return base as T & VitalsViewParams;
  return { ...base, ...viewNavParams };
}

export type VitalsDetailRouteName = Extract<
  keyof RootStackParamList,
  | 'HeartRatePage'
  | 'ConsumptionPage'
  | 'BloodSugarPage'
  | 'BloodPressurePage'
  | 'StepsPage'
  | 'SleepPage'
  | 'BloodOxygenPage'
  | 'BodyTemperaturePage'
  | 'WeightPage'
  | 'BloodLipidPage'
  | 'UricAcidPage'
  | 'AllDataPage'
>;

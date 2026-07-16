import moment from 'moment';
import { addMeasureData } from '@/api/measureData';
import { updateUserBaseInfo } from '@/api/patient';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

function normalizeWeight(weight: number) {
  return Number(Number(weight).toFixed(1));
}

/** 资料页改体重后，同步新增一条体重测量记录 */
export async function syncProfileWeightToMeasureData(weight: number) {
  const val = normalizeWeight(weight);
  const res = await addMeasureData({
    type: '体重',
    customerLocalDate: moment().format('YYYY-MM-DD'),
    dataTime: moment().format('HH:mm'),
    val,
    measurementStatus: '',
    measuringSite: '',
    remark: '',
  });
  if (!isResourceApiOk(res as { code?: number })) {
    const msg =
      (res as { msg?: string; message?: string })?.msg ??
      (res as { message?: string })?.message ??
      '体重记录同步失败';
    throw new Error(msg);
  }
}

/** 新增/编辑体重测量后，同步更新个人资料体重 */
export async function syncMeasureWeightToUserBaseInfo(weight: number) {
  const val = normalizeWeight(weight);
  const res = await updateUserBaseInfo({ weight: val });
  if (!isResourceApiOk(res as { code?: number })) {
    const msg =
      (res as { msg?: string; message?: string })?.msg ??
      (res as { message?: string })?.message ??
      '资料体重同步失败';
    throw new Error(msg);
  }
}

export function isSameWeight(a?: number | null, b?: number | null) {
  if (a == null || b == null) return a == null && b == null;
  return normalizeWeight(a) === normalizeWeight(b);
}

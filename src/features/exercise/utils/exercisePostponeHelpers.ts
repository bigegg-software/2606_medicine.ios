import { Modal, Toast } from '@ant-design/react-native';
import moment from 'moment';
import {
  addExPostponeChoice,
  getExPostponeChoiceInfo,
  type ExPostponeChoiceValue,
} from '@/api/exPostponeChoice';
import { postponeThisWeek, type PostponeThisWeekInfo } from '@/api/exPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export function shouldShowPostponeThisWeekDialog(
  info?: PostponeThisWeekInfo | null,
) {
  return Boolean(info?.canPostpone);
}

/** 今日是否已记录过顺延弹框选择 */
export async function hasExPostponeChoiceToday(exPatientRuleId: string) {
  try {
    const today = moment().format('YYYY-MM-DD');
    const res = await getExPostponeChoiceInfo({
      exPatientRuleId,
      customerLocalDate: today,
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) return false;
    const data = apiResourceData(
      res as unknown as { code?: number; data?: { id?: string | number; choice?: number } },
    );
    return data != null && (data.id != null || data.choice != null);
  } catch {
    return false;
  }
}

export async function recordExPostponeChoice(
  exPatientRuleId: string,
  choice: ExPostponeChoiceValue,
) {
  try {
    const res = await addExPostponeChoice({
      exPatientRuleId: String(exPatientRuleId),
      customerLocalDate: moment().format('YYYY-MM-DD'),
      choice,
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) {
      const msg = String((res as { msg?: string })?.msg ?? '').trim();
      Toast.show(msg || '记录失败');
      return false;
    }
    return true;
  } catch {
    Toast.show('记录失败');
    return false;
  }
}

export async function postponeThisWeekByRuleId(exPatientRuleId: string) {
  try {
    const res = await postponeThisWeek(exPatientRuleId);
    if (!isResourceApiOk(res as unknown as { code?: number })) {
      const msg = String((res as { msg?: string })?.msg ?? '').trim();
      Toast.show(msg || '顺延失败');
      return false;
    }
    Toast.show('已顺延本周训练');
    return true;
  } catch {
    Toast.show('顺延失败');
    return false;
  }
}

/** 本周未完成课程提示：完成之前训练 = 顺延；开始今日训练 = 不顺延 */
export function showPostponeThisWeekDialog(options?: {
  onCompletePrevious?: () => void;
  onStartToday?: () => void;
}) {
  Modal.alert(
    '有未完成的训练',
    '本周还有之前未完成的课程。可以先完成之前的课程，也可以直接开始今天的训练。',
    [
      {
        text: '完成之前训练',
        style: { color: '#000000', fontSize: 14 },
        onPress: () => {
          options?.onCompletePrevious?.();
        },
      },
      {
        text: '开始今日训练',
        style: { fontSize: 14 },
        onPress: () => {
          options?.onStartToday?.();
        },
      },
    ],
  );
}

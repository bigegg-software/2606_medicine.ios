import moment from 'moment';
import {
  addFamilyMedicationRemindLog,
  getFamilyMedicationRemindLogList,
  type FamilyMedicationRemindLogItem,
} from '@/api/familyMedicationRemindLog';
import { addPatientMessage } from '@/api/message';
import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser } from '@/api/user';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { maskFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';

/** 家属用药提醒消息类型（写死） */
export const FAMILY_MEDICATION_REMIND_MESSAGE_TYPE = 'health_medication_tip';

/** 提醒文案中的发送方姓名：当前子女昵称，脱敏展示 */
export function resolveFamilyMedicationRemindSenderName(
  user?: UserBaseInfo | null,
  systemUser?: SystemUser | null,
): string {
  const raw = getDisplayUserName(user, systemUser).trim() || '家人';
  return maskFamilyDisplayName(raw) || '家人';
}

export function buildFamilyMedicationRemindTitle(senderName: string) {
  return `「${senderName}」提醒您按时用药`;
}

export function buildFamilyMedicationRemindContent(
  senderName: string,
  medicationName: string,
) {
  const drug = medicationName.trim() || '药物';
  return `您的家人「${senderName}」提醒您，今天的【${drug}】到了服用时间，请按照用药安排及时服药，记得不要漏服哦。`;
}

export function getFamilyMedicationRemindLocalDate() {
  return moment().format('YYYY-MM-DD');
}

export function normalizeFamilyMedicationRemindTime(time?: string) {
  const parsed = moment(time, ['HH:mm', 'H:mm'], true);
  return parsed.isValid() ? parsed.format('HH:mm') : String(time ?? '').trim();
}

export function buildFamilyMedicationRemindKey(
  medicationPlanId?: string | number | null,
  time?: string,
) {
  const id = String(medicationPlanId ?? '').trim();
  const remindTime = normalizeFamilyMedicationRemindTime(time);
  if (!id || !remindTime) return '';
  return `${id}-${remindTime}`;
}

export function mapFamilyMedicationRemindLogsToKeys(
  logs: FamilyMedicationRemindLogItem[] | undefined,
): Record<string, true> {
  const keys: Record<string, true> = {};
  (logs ?? []).forEach(log => {
    const key = buildFamilyMedicationRemindKey(log.medicationPlanId, log.time);
    if (key) keys[key] = true;
  });
  return keys;
}

/** 查询今日已提醒的用药计划（planId + 时间点） */
export async function loadFamilyMedicationRemindedKeys(
  patientUserId: string,
): Promise<Record<string, true>> {
  const id = String(patientUserId ?? '').trim();
  if (!id) return {};
  try {
    const res = await getFamilyMedicationRemindLogList({
      patientUserId: id,
      customerLocalDate: getFamilyMedicationRemindLocalDate(),
    });
    const logs = apiResourceData<FamilyMedicationRemindLogItem[]>(res) ?? [];
    return mapFamilyMedicationRemindLogsToKeys(Array.isArray(logs) ? logs : []);
  } catch {
    return {};
  }
}

async function recordFamilyMedicationRemindLog(options: {
  patientUserId: string;
  medicationPlanId: string;
  time: string;
}): Promise<{ ok: boolean }> {
  const patientUserId = String(options.patientUserId ?? '').trim();
  const medicationPlanId = String(options.medicationPlanId ?? '').trim();
  const time = normalizeFamilyMedicationRemindTime(options.time);
  if (!patientUserId || !medicationPlanId || !time) {
    return { ok: false };
  }
  try {
    const res = await addFamilyMedicationRemindLog({
      patientUserId,
      medicationPlanId,
      customerLocalDate: getFamilyMedicationRemindLocalDate(),
      time,
    });
    return { ok: isResourceApiOk(res as { code?: number }) };
  } catch {
    return { ok: false };
  }
}

/** 向指定家人发送用药提醒消息，并记录提醒日志；成功返回 true */
export async function sendFamilyMedicationRemindMessage(options: {
  patientUserId: string;
  senderName: string;
  medicationName: string;
  bizId?: string;
  medicationPlanId?: string;
  time?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const patientUserId = String(options.patientUserId ?? '').trim();
  if (!patientUserId) {
    return { ok: false, message: '家人信息无效' };
  }
  const senderName = options.senderName.trim() || '家人';
  const title = buildFamilyMedicationRemindTitle(senderName);
  const content = buildFamilyMedicationRemindContent(
    senderName,
    options.medicationName,
  );
  try {
    const res = await addPatientMessage({
      userId: patientUserId,
      title,
      content,
      type: FAMILY_MEDICATION_REMIND_MESSAGE_TYPE,
      isRead: 0,
      visibleToOld: 1,
      visibleToChild: 0,
      visibleToYihu: 0,
      visibleToAdmin: 0,
      isWarning: 0,
      appType: 0,
      bizId: options.bizId?.trim() || '',
    });
    if (!isResourceApiOk(res as { code?: number })) {
      return {
        ok: false,
        message: (res as { msg?: string; message?: string })?.msg
          || (res as { message?: string })?.message
          || '提醒发送失败',
      };
    }
    if (options.medicationPlanId && options.time) {
      await recordFamilyMedicationRemindLog({
        patientUserId,
        medicationPlanId: options.medicationPlanId,
        time: options.time,
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, message: '提醒发送失败，请稍后重试' };
  }
}

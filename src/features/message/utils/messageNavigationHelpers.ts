import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';
import { getActivityInfo } from '@/api/activity';
import { getInUseDietPatientRuleInfo } from '@/api/dietPatientRule';
import { getIdentityAuditInfo } from '@/api/identityAudit';
import { getLiveStreamInfo } from '@/api/liveStream';
import type { PatientMessageItem } from '@/api/message';
import { getUserQuestionDetail } from '@/api/questionTemplate';
import type { RootStackParamList } from '@/route/router';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { isFamilyBindInviteMessageType } from '@/src/familyPage/profilePage/utils/familyBindInviteHelpers';
import { parseMessageCreateTime } from './messageHelpers';

export const MESSAGE_NOT_FOUND_TOAST = '信息不存在';

const MEDICATION_TYPES = new Set([
  'health_medication_tip',
  'health_medication_remind_warning',
  'health_medication_missed_warning',
]);

const MEAL_TYPES = new Set([
  'health_diet_meal_tip',
  'health_diet_protein_streak_warning',
]);

const EXERCISE_TYPES = new Set([
  'health_exercise_streak_warning',
  'health_exercise_not_started_tip',
  'health_exercise_goal_complete_tip',
]);

const QUESTIONNAIRE_TYPES = new Set([
  'health_fall_risk_warning',
  'health_daily_living_warning',
  'health_nutritional_risk_warning',
  'health_eq_index_warning',
]);

const ACTIVITY_TYPES = new Set([
  'activity_will_start_tip',
  'activity_change_notify',
  'health_activity_absent_warning',
]);

const LIVE_TYPES = new Set([
  'live_reservation_start_tip',
  'live_change_notify',
]);

const ACTIVITY_CANCEL_TYPES = new Set(['activiey_cancel']);

const VITAL_ALL_DATA_TYPE: Record<string, NonNullable<RootStackParamList['AllDataPage']['type']>> = {
  health_bp_warning: '血压',
  health_bs_warning: '血糖',
  health_hr_warning: '心率',
  health_sleep_warning: '睡眠',
  health_spo2_warning: '血氧',
  health_temp_warning: '体温',
  health_ua_warning: '尿酸',
  health_lipid_warning: '血脂',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Existence = 'ok' | 'missing' | 'unknown';

async function checkResourceExists(fetcher: () => Promise<unknown>): Promise<Existence> {
  try {
    const res = await fetcher();
    if (!isResourceApiOk(res as { code?: number })) return 'missing';
    const data = apiResourceData(res as { code?: number; data?: unknown });
    if (data == null) return 'missing';
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data as object).length === 0) {
      return 'missing';
    }
    return 'ok';
  } catch {
    return 'unknown';
  }
}

function normalizeBizId(bizId?: string | null) {
  const value = String(bizId ?? '').trim();
  return value || '';
}

/** 取消息发送日（createTime 北京时间墙钟日期），用于打开当日体征记录 */
function resolveMessageSendDate(createTime?: string | null) {
  const raw = String(createTime ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const time = parseMessageCreateTime(createTime ?? undefined);
  if (time) return time.format('YYYY-MM-DD');
  return moment().format('YYYY-MM-DD');
}

/** 解析消息点击后的跳转目标；缺失业务数据时返回 missing */
export async function resolveMessageNavigation(item: {
  type?: string | null;
  bizId?: string | null;
  messageId?: string | number | null;
  createTime?: string | null;
}): Promise<
  | { action: 'none' }
  | { action: 'missing' }
  | { action: 'navigate'; name: keyof RootStackParamList; params?: object }
> {
  const type = String(item.type ?? '').trim();
  if (!type) return { action: 'none' };

  if (ACTIVITY_CANCEL_TYPES.has(type)) {
    return { action: 'none' };
  }

  if (isFamilyBindInviteMessageType(type)) {
    const messageId = item.messageId != null ? String(item.messageId) : '';
    if (!messageId) return { action: 'none' };
    return {
      action: 'navigate',
      name: 'FamilyBindInvitePage',
      params: { messageId },
    };
  }

  const bizId = normalizeBizId(item.bizId);

  if (MEDICATION_TYPES.has(type)) {
    return { action: 'navigate', name: 'Medication', params: { tab: 'medication' } };
  }

  if (MEAL_TYPES.has(type)) {
    const dietExists = await checkResourceExists(() => getInUseDietPatientRuleInfo());
    if (dietExists === 'missing') return { action: 'missing' };
    return {
      action: 'navigate',
      name: 'NutritionPage',
      params: { tab: 'prescription' },
    };
  }

  if (EXERCISE_TYPES.has(type)) {
    return {
      action: 'navigate',
      name: 'MainTabs',
      params: { screen: 'Schedule' },
    };
  }

  if (QUESTIONNAIRE_TYPES.has(type)) {
    if (!bizId) return { action: 'missing' };
    const exists = await checkResourceExists(() => getUserQuestionDetail(bizId));
    if (exists === 'missing') return { action: 'missing' };
    return {
      action: 'navigate',
      name: 'QuestionnaireDetail',
      params: { id: bizId },
    };
  }

  if (ACTIVITY_TYPES.has(type)) {
    if (!bizId) return { action: 'none' };
    const exists = await checkResourceExists(() => getActivityInfo(bizId));
    if (exists === 'missing') return { action: 'missing' };
    return {
      action: 'navigate',
      name: 'ActivityDetail',
      params: { id: bizId },
    };
  }

  if (LIVE_TYPES.has(type)) {
    if (!bizId) return { action: 'none' };
    const exists = await checkResourceExists(() => getLiveStreamInfo(bizId));
    if (exists === 'missing') return { action: 'missing' };
    return {
      action: 'navigate',
      name: 'LiveDetail',
      params: { liveId: bizId },
    };
  }

  const vitalType = VITAL_ALL_DATA_TYPE[type];
  if (vitalType) {
    return {
      action: 'navigate',
      name: 'AllDataPage',
      params: {
        type: vitalType,
        date: resolveMessageSendDate(item.createTime),
      },
    };
  }

  if (type === 'identity_audit_approved') {
    return { action: 'none' };
  }

  if (type === 'identity_audit_rejected') {
    try {
      const res = (await getIdentityAuditInfo()) as unknown as {
        code?: number;
        data?: { authStatus?: number | null };
      };
      if (!isResourceApiOk(res)) return { action: 'none' };
      const authStatus = apiResourceData<{ authStatus?: number | null }>(res)?.authStatus;
      // 仅未审核通过时可重新提交
      if (Number(authStatus) !== 2) return { action: 'none' };
      return { action: 'navigate', name: 'AuthenticationPage' };
    } catch {
      return { action: 'none' };
    }
  }

  return { action: 'none' };
}

export async function navigateFromMessage(
  navigation: Nav,
  item: Pick<PatientMessageItem, 'type' | 'bizId' | 'messageId' | 'createTime'>,
): Promise<'navigated' | 'missing' | 'none'> {
  const result = await resolveMessageNavigation({
    type: item.type,
    bizId: item.bizId,
    messageId: item.messageId,
    createTime: item.createTime,
  });
  if (result.action === 'missing') return 'missing';
  if (result.action === 'none') return 'none';
  navigation.navigate(result.name as never, result.params as never);
  return 'navigated';
}

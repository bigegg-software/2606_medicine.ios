import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import type { MessageScopeParams, PatientMessageItem } from '@/api/message';
import { normalizeIdentityPerspective } from '@/src/features/auth/utils/identityHelpers';

export const MESSAGE_UNREAD_CHANGED = 'MESSAGE_UNREAD_CHANGED';

/** 组装消息接口必填的身份视角与患者 userIds */
export function buildMessageScopeParams(options: {
  identityPerspective?: string | null;
  userId?: number | string | null;
  userIds?: Array<number | string> | string | null;
}): MessageScopeParams {
  const perspective = normalizeIdentityPerspective(options.identityPerspective) || 'old';
  let userIds = '';
  if (typeof options.userIds === 'string') {
    userIds = options.userIds.trim();
  } else if (Array.isArray(options.userIds)) {
    userIds = options.userIds.map(id => String(id)).filter(Boolean).join(',');
  } else if (options.userId != null && String(options.userId).trim()) {
    userIds = String(options.userId);
  }
  return {
    identityPerspective: perspective,
    userIds,
  };
}

export type MessageCategoryKey =
  | 'exercise'
  | 'health'
  | 'questionnaire'
  | 'activity'
  | 'live'
  | 'system'
  | 'meal'
  | 'medication';

export type MessageCategoryMeta = {
  key: MessageCategoryKey;
  label: string;
  icon: ImageSourcePropType;
};

export type MessageSeverityMeta = {
  key: 'tip' | 'warning' | 'urgent';
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
};

const CATEGORY_META: Record<MessageCategoryKey, MessageCategoryMeta> = {
  exercise: {
    key: 'exercise',
    label: '运动通知',
    icon: require('@/assets/images/message/icon_yd.png'),
  },
  health: {
    key: 'health',
    label: '健康通知',
    icon: require('@/assets/images/message/icon_jk.png'),
  },
  questionnaire: {
    key: 'questionnaire',
    label: '问卷通知',
    icon: require('@/assets/images/message/icon_wj.png'),
  },
  activity: {
    key: 'activity',
    label: '活动通知',
    icon: require('@/assets/images/message/icon_hd.png'),
  },
  live: {
    key: 'live',
    label: '直播通知',
    icon: require('@/assets/images/assistant/icon_zb.png'),
  },
  system: {
    key: 'system',
    label: '系统通知',
    icon: require('@/assets/images/message/icon_xt.png'),
  },
  meal: {
    key: 'meal',
    label: '用餐通知',
    icon: require('@/assets/images/message/icon_yc.png'),
  },
  medication: {
    key: 'medication',
    label: '用药通知',
    icon: require('@/assets/images/message/icon_yy.png'),
  },
};

const SEVERITY_META: Record<'tip' | 'warning' | 'urgent', MessageSeverityMeta> = {
  tip: {
    key: 'tip',
    label: '提示',
    color: '#56A2D8',
    backgroundColor: 'rgba(86,162,216,0.06)',
    borderColor: 'rgba(86,162,216,0.3)',
  },
  warning: {
    key: 'warning',
    label: '警告',
    color: '#EE9C44',
    backgroundColor: 'rgba(238,156,68,0.06)',
    borderColor: 'rgba(238,156,68,0.3)',
  },
  urgent: {
    key: 'urgent',
    label: '严重',
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
};

function matchType(type: string | undefined, prefixes: string[]) {
  const value = String(type ?? '').trim();
  if (!value) return false;
  return prefixes.some(prefix => value === prefix || value.startsWith(prefix));
}

export function resolveMessageCategory(type?: string): MessageCategoryMeta {
  if (matchType(type, ['health_medication'])) return CATEGORY_META.medication;
  if (matchType(type, ['health_exercise'])) return CATEGORY_META.exercise;
  if (matchType(type, ['health_diet'])) return CATEGORY_META.meal;
  if (
    matchType(type, [
      'health_fall_risk',
      'health_daily_living',
      'health_nutritional_risk',
      'health_eq_index',
    ])
  ) {
    return CATEGORY_META.questionnaire;
  }
  if (matchType(type, ['live_'])) {
    return CATEGORY_META.live;
  }
  if (
    matchType(type, [
      'activiey_cancel',
      'activity_',
      'health_activity',
    ])
  ) {
    return CATEGORY_META.activity;
  }
  if (
    matchType(type, [
      'health_bp',
      'health_bs',
      'health_hr',
      'health_sleep',
      'health_spo2',
      'health_temp',
      'health_ua',
      'health_lipid',
    ])
  ) {
    return CATEGORY_META.health;
  }
  if (matchType(type, ['family_', 'identity_'])) return CATEGORY_META.system;
  return CATEGORY_META.system;
}

export function resolveMessageSeverity(
  item: Pick<PatientMessageItem, 'isWarning' | 'warningSeverity'>,
): MessageSeverityMeta | null {
  if (Number(item.isWarning) !== 1) return null;
  const key = String(item.warningSeverity ?? '').trim().toLowerCase();
  if (key === 'tip' || key === 'warning' || key === 'urgent') {
    return SEVERITY_META[key];
  }
  return SEVERITY_META.warning;
}

/** createTime 为北京时间墙钟，按客户端时区展示 */
export function parseMessageCreateTime(createTime?: string) {
  if (!createTime?.trim()) return null;
  const parsed = moment(`${createTime.trim()}+08:00`, 'YYYY-MM-DD HH:mm:ssZ');
  return parsed.isValid() ? parsed.local() : null;
}

export function formatMessageListTime(createTime?: string) {
  const time = parseMessageCreateTime(createTime);
  if (!time) return '--';

  const now = moment();
  const diffSec = Math.max(0, now.diff(time, 'seconds'));
  if (diffSec < 60) return `${diffSec}秒前`;

  const diffMin = now.diff(time, 'minutes');
  if (diffMin < 60) return `${diffMin}分钟前`;

  if (time.isSame(now, 'day')) {
    const diffHour = Math.max(1, now.diff(time, 'hours'));
    return `${diffHour}小时前`;
  }

  if (time.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return `昨天 ${time.format('HH:mm')}`;
  }

  return time.format('YYYY/M/D HH:mm');
}

export function resolveMessageIsRead(
  item: Pick<PatientMessageItem, 'isRead' | 'isReadByChild'>,
  identityPerspective?: string | null,
) {
  if (identityPerspective === 'child') {
    return Number(item.isReadByChild) === 1;
  }
  return Number(item.isRead) === 1;
}

export function formatHomeUnreadBadge(count: number) {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return String(count);
}

const MESSAGE_TYPES_WITHOUT_DETAIL = new Set([
  'identity_audit_approved',
  'family_bind_auth_approved',
  'family_bind_auth_rejected',
]);

/** 结果类通知仅展示文案，不显示「查看详情」 */
export function shouldShowMessageDetailLink(type?: string | null) {
  return !MESSAGE_TYPES_WITHOUT_DETAIL.has(String(type ?? '').trim());
}

export type MessageListDisplayItem = {
  id: string;
  title: string;
  content: string;
  timeText: string;
  icon: ImageSourcePropType;
  severity: MessageSeverityMeta | null;
  unread: boolean;
  raw: PatientMessageItem;
};

export function buildMessageListDisplayItem(
  item: PatientMessageItem,
  identityPerspective?: string | null,
): MessageListDisplayItem {
  const category = resolveMessageCategory(item.type);
  return {
    id: String(item.messageId),
    title: category.label,
    content: item.content?.trim() || item.title?.trim() || '--',
    timeText: formatMessageListTime(item.createTime),
    icon: category.icon,
    severity: category.key === 'system' ? null : resolveMessageSeverity(item),
    unread: !resolveMessageIsRead(item, identityPerspective),
    raw: item,
  };
}

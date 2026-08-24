import type { FamilyBindItem } from '@/api/familyBind';
import type { MessageScopeParams } from '@/api/message';
import type { PatientMessageItem } from '@/api/message';
import {
  buildMessageScopeParams,
  formatMessageListTime,
  resolveMessageCategory,
  resolveMessageIsRead,
  resolveMessageSeverity,
  resolveMessageTitle,
  type MessageListDisplayItem,
} from '@/src/features/message/utils/messageHelpers';
import { normalizeIdentityPerspective } from '@/src/features/auth/utils/identityHelpers';
import { getApprovedFamilyBindList } from './familyProfileHelpers';

/** 预警列表展示项（始终展示严重级别标签） */
export function buildWarningListDisplayItem(
  item: PatientMessageItem,
  identityPerspective?: string | null,
): MessageListDisplayItem {
  const category = resolveMessageCategory(item.type);
  return {
    id: String(item.messageId),
    title: resolveMessageTitle(item),
    content: item.content?.trim() || '--',
    timeText: formatMessageListTime(item.createTime),
    icon: category.icon,
    severity: resolveMessageSeverity(item),
    unread: !resolveMessageIsRead(item, identityPerspective),
    raw: item,
  };
}

/** 已绑定家人的 patientUserId 列表 */
export function collectFamilyAlertPatientUserIds(list: FamilyBindItem[]): string[] {
  const ids: string[] = [];
  getApprovedFamilyBindList(list).forEach(item => {
    const id = item.patientUserId != null ? String(item.patientUserId).trim() : '';
    if (id && !ids.includes(id)) ids.push(id);
  });
  return ids;
}

/**
 * 家人预警页查询范围：
 * - identityPerspective=child（家人视角）
 * - userIds = 当前登录用户 id + 已绑定家人 id
 */
export function buildFamilyAlertScopeParams(options: {
  identityPerspective?: string | null;
  userId?: number | string | null;
  familyUserIds?: Array<number | string | null | undefined> | null;
}): MessageScopeParams {
  const perspective = normalizeIdentityPerspective(options.identityPerspective) || 'child';
  const ids: string[] = [];
  const pushId = (value?: number | string | null) => {
    const id = value != null ? String(value).trim() : '';
    if (id && !ids.includes(id)) ids.push(id);
  };
  pushId(options.userId);
  (options.familyUserIds ?? []).forEach(pushId);

  return buildMessageScopeParams({
    identityPerspective: perspective === 'child' ? 'child' : perspective,
    userIds: ids,
  });
}

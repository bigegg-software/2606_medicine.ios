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

/**
 * 家人预警页查询范围：
 * - 固定 identityPerspective=child（家人视角）
 * - userIds 传当前登录用户 id
 */
export function buildFamilyAlertScopeParams(options: {
  identityPerspective?: string | null;
  userId?: number | string | null;
}): MessageScopeParams {
  const perspective = normalizeIdentityPerspective(options.identityPerspective) || 'child';
  return buildMessageScopeParams({
    identityPerspective: perspective === 'child' ? 'child' : perspective,
    userId: options.userId,
  });
}

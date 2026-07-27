import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type MessageWarningSeverity = 'tip' | 'warning' | 'urgent' | string;

export type PatientMessageItem = {
  messageId: number | string;
  userId?: number | string;
  title?: string;
  content?: string;
  type?: string;
  isRead?: number;
  isReadByChild?: number;
  isReadByYihu?: number;
  isReadByAdmin?: number;
  visibleToOld?: number;
  visibleToChild?: number;
  visibleToYihu?: number;
  visibleToAdmin?: number;
  isWarning?: number;
  warningSeverity?: MessageWarningSeverity;
  warningHandleStatus?: string;
  warningHandleType?: string;
  warningHandleTypeLabel?: string;
  warningHandleRemark?: string;
  bizId?: string;
  createTime?: string;
  appType?: number;
  params?: Record<string, unknown>;
};

export type MessageIdentityPerspective = 'old' | 'child' | string;

export type MessageScopeParams = {
  /** 身份视角：old 老人 / child 子女 */
  identityPerspective: MessageIdentityPerspective;
  /** 患者用户 id，多个英文逗号分隔 */
  userIds: string;
};

export type MessageListParams = MessageScopeParams & {
  pageSize?: number;
  pageNum?: number;
  isWarning?: number | '';
  warningSeverity?: string;
};

export type MessageListResult = ApiResult & {
  total?: number;
  rows?: PatientMessageItem[];
};

export type MessageUnreadCountParams = MessageScopeParams & {
  isWarning?: number | '';
  warningSeverity?: string;
};

export type MessageUnreadCountResult = ApiResult<number>;

export type MarkMessageReadParams = {
  identityPerspective: MessageIdentityPerspective;
};

export type MarkAllMessagesReadParams = MessageScopeParams;

function buildOptionalWarningParams(params: {
  isWarning?: number | '';
  warningSeverity?: string;
}) {
  return {
    ...(params.isWarning === '' || params.isWarning == null
      ? {}
      : { isWarning: params.isWarning }),
    ...(params.warningSeverity ? { warningSeverity: params.warningSeverity } : {}),
  };
}

export const getMessageList = (params: MessageListParams) =>
  request.get<MessageListResult>('/patient/message/list', {
    params: {
      pageNum: params.pageNum ?? 1,
      pageSize: params.pageSize ?? 20,
      identityPerspective: params.identityPerspective,
      userIds: params.userIds,
      ...buildOptionalWarningParams(params),
    },
  });

export const getMessageUnreadCount = (params: MessageUnreadCountParams) =>
  request.get<MessageUnreadCountResult>('/patient/message/unReadCount', {
    params: {
      identityPerspective: params.identityPerspective,
      userIds: params.userIds,
      ...buildOptionalWarningParams(params),
    },
  });

export const markMessageRead = (
  messageId: number | string,
  params: MarkMessageReadParams,
) =>
  request.put<ApiResult>(`/patient/message/${String(messageId)}`, undefined, {
    params: {
      identityPerspective: params.identityPerspective,
    },
  });

export const markAllMessagesRead = (params: MarkAllMessagesReadParams) =>
  request.put<ApiResult>('/patient/message/readAll', undefined, {
    params: {
      identityPerspective: params.identityPerspective,
      userIds: params.userIds,
    },
  });

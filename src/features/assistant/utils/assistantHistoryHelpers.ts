import moment from 'moment';
import { getUserChatPageList, type UserChatListItem } from '@/api/assistant';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export const ASSISTANT_HISTORY_PAGE_SIZE = 20;

export function formatChatHistoryTime(createTime?: string) {
  if (!createTime) return '';
  const parsed = moment(createTime, 'YYYY-MM-DD HH:mm:ss');
  if (!parsed.isValid()) return createTime;
  const now = moment();
  if (parsed.isSame(now, 'day')) return parsed.format('HH:mm');
  if (parsed.isSame(now, 'year')) return parsed.format('MM-DD HH:mm');
  return parsed.format('YYYY-MM-DD');
}

export function getChatHistoryTitle(item: UserChatListItem) {
  const title = item.question?.trim();
  return title || '新对话';
}

export async function loadUserChatHistoryPage(pageNum: number, pageSize: number) {
  try {
    const res = await getUserChatPageList({ pageNum, pageSize });
    if (!isResourceApiOk(res)) {
      return { rows: [] as UserChatListItem[], hasMore: false };
    }
    const page = apiResourceData<{ total?: number; rows?: UserChatListItem[] }>(res);
    const rows = Array.isArray(page?.rows) ? page.rows : [];
    const total = page?.total ?? rows.length;
    return {
      rows,
      hasMore: pageNum * pageSize < total,
    };
  } catch {
    return { rows: [] as UserChatListItem[], hasMore: false };
  }
}

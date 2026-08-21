import type { FamilyBindItem } from '@/api/familyBind';
import {
  getMessageList,
  type PatientMessageItem,
} from '@/api/message';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { normalizeIdentityPerspective } from '@/src/features/auth/utils/identityHelpers';
import {
  resolveMessageIsRead,
  resolveMessageTitle,
} from '@/src/features/message/utils/messageHelpers';
import {
  getApprovedFamilyBindList,
  getFamilyTabLabel,
} from './familyProfileHelpers';

export type FamilyHomeWarningTodoItem = {
  id: string;
  text: string;
  relationLabel: string;
  patientUserId: string;
  unread: boolean;
  raw: PatientMessageItem;
};

type FamilyHomeWarningMember = {
  patientUserId: string;
  relationLabel: string;
};

export type FamilyHomeWarningTodosResult = {
  items: FamilyHomeWarningTodoItem[];
  total: number;
};

function buildWarningMembers(list: FamilyBindItem[]): FamilyHomeWarningMember[] {
  return getApprovedFamilyBindList(list)
    .map(item => {
      const patientUserId =
        item.patientUserId != null ? String(item.patientUserId).trim() : '';
      if (!patientUserId) return null;
      return {
        patientUserId,
        relationLabel: getFamilyTabLabel(item),
      };
    })
    .filter((item): item is FamilyHomeWarningMember => item != null);
}

function toTodoItem(
  row: PatientMessageItem,
  member: FamilyHomeWarningMember,
  identityPerspective: string,
): FamilyHomeWarningTodoItem {
  const title = resolveMessageTitle(row);
  const content = row.content?.trim() || '';
  return {
    id: String(row.messageId),
    text: content || title,
    relationLabel: member.relationLabel,
    patientUserId: member.patientUserId,
    unread: !resolveMessageIsRead(row, identityPerspective),
    raw: row,
  };
}

/** 按规则挑选首页展示的预警：单人取最新 2 条；多人取前两个亲属各 1 条 */
export function pickFamilyHomeWarningTodos(
  rows: PatientMessageItem[],
  members: FamilyHomeWarningMember[],
  identityPerspective: string,
): FamilyHomeWarningTodoItem[] {
  if (members.length === 0 || rows.length === 0) return [];

  if (members.length === 1) {
    const member = members[0];
    return rows
      .filter(row => {
        if (row.userId == null || row.userId === '') return true;
        return String(row.userId) === member.patientUserId;
      })
      .slice(0, 2)
      .map(row => toTodoItem(row, member, identityPerspective));
  }

  const picked: FamilyHomeWarningTodoItem[] = [];
  const usedIds = new Set<string>();

  for (const member of members.slice(0, 2)) {
    const row = rows.find(item => {
      const id = String(item.messageId);
      if (usedIds.has(id)) return false;
      if (item.userId == null || item.userId === '') return false;
      return String(item.userId) === member.patientUserId;
    });
    if (!row) continue;
    usedIds.add(String(row.messageId));
    picked.push(toTodoItem(row, member, identityPerspective));
  }

  return picked;
}

/** 拉取家人预警消息，供首页「重要待办」展示 */
export async function loadFamilyHomeWarningTodos(
  list: FamilyBindItem[],
  identityPerspective?: string | null,
): Promise<FamilyHomeWarningTodosResult> {
  const members = buildWarningMembers(list);
  if (members.length === 0) {
    return { items: [], total: 0 };
  }

  const perspective = normalizeIdentityPerspective(identityPerspective) || 'child';
  const userIds = members.map(item => item.patientUserId).join(',');

  try {
    const res = await getMessageList({
      pageNum: 1,
      pageSize: 20,
      identityPerspective: perspective,
      userIds,
      isWarning: 1,
    });
    if (!isResourceApiOk(res as { code?: number })) {
      return { items: [], total: 0 };
    }
    const rows = getResourceRows<PatientMessageItem>(
      res as { code?: number; rows?: PatientMessageItem[] },
    );
    const total = Number((res as { total?: number }).total ?? rows.length);
    return {
      items: pickFamilyHomeWarningTodos(rows, members, perspective),
      total: Number.isFinite(total) ? Math.max(0, total) : rows.length,
    };
  } catch {
    return { items: [], total: 0 };
  }
}

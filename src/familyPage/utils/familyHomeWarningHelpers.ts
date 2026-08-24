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

const FAMILY_HOME_WARNING_DISPLAY_LIMIT = 2;
const FAMILY_HOME_WARNING_MEMBER_LIMIT_DEFAULT = 2;
const FAMILY_HOME_WARNING_MEMBER_LIMIT_FALLBACK = 3;

function findLatestWarningForMember(
  rows: PatientMessageItem[],
  member: FamilyHomeWarningMember,
  usedIds: Set<string>,
): PatientMessageItem | undefined {
  return rows.find(item => {
    const id = String(item.messageId);
    if (usedIds.has(id)) return false;
    if (item.userId == null || item.userId === '') return false;
    return String(item.userId) === member.patientUserId;
  });
}

/**
 * 按规则挑选首页展示的预警：
 * - 无家人：空
 * - 单人：最新 2 条
 * - 多人：前两个亲属各 1 条；不足 2 条时再扩到前三个亲属各取 1 条补齐
 */
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
      .slice(0, FAMILY_HOME_WARNING_DISPLAY_LIMIT)
      .map(row => toTodoItem(row, member, identityPerspective));
  }

  const picked: FamilyHomeWarningTodoItem[] = [];
  const usedIds = new Set<string>();
  const usedMemberIds = new Set<string>();

  const pickFromMembers = (limit: number) => {
    for (const member of members.slice(0, limit)) {
      if (picked.length >= FAMILY_HOME_WARNING_DISPLAY_LIMIT) break;
      if (usedMemberIds.has(member.patientUserId)) continue;
      const row = findLatestWarningForMember(rows, member, usedIds);
      if (!row) continue;
      usedIds.add(String(row.messageId));
      usedMemberIds.add(member.patientUserId);
      picked.push(toTodoItem(row, member, identityPerspective));
    }
  };

  pickFromMembers(FAMILY_HOME_WARNING_MEMBER_LIMIT_DEFAULT);
  if (picked.length < FAMILY_HOME_WARNING_DISPLAY_LIMIT) {
    pickFromMembers(FAMILY_HOME_WARNING_MEMBER_LIMIT_FALLBACK);
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

import type { HealthTestItemKeyMap } from '@/api/healthTestItemKeyMap';

export type HealthTestObjField = {
  key: string;
  label: string;
};

/** 将 objValueDes 转为有序分项字段列表 */
export function buildObjValueFields(
  objValueDes?: Record<string, string> | null,
): HealthTestObjField[] {
  if (!objValueDes || typeof objValueDes !== 'object') return [];
  return Object.entries(objValueDes)
    .map(([key, label]) => ({
      key: String(key).trim(),
      label: String(label ?? '').trim(),
    }))
    .filter(item => item.key && item.label);
}

/** 按 healthTestItemId / itemKey 查找映射 */
export function findHealthTestItemKeyMap(
  list: HealthTestItemKeyMap[] | null | undefined,
  options: {
    healthTestItemId?: string | number | null;
    itemKey?: string | null;
  },
): HealthTestItemKeyMap | null {
  const rows = Array.isArray(list) ? list : [];
  if (rows.length === 0) return null;

  const id = options.healthTestItemId != null
    ? String(options.healthTestItemId).trim()
    : '';
  if (id) {
    const byId = rows.find(item => String(item.healthTestItemId ?? '').trim() === id);
    if (byId) return byId;
  }

  const itemKey = options.itemKey?.trim() ?? '';
  if (itemKey) {
    return rows.find(item => item.itemKey?.trim() === itemKey) ?? null;
  }
  return null;
}

export function createEmptyObjValueInputs(fields: HealthTestObjField[]) {
  const result: Record<string, string> = {};
  fields.forEach(field => {
    result[field.key] = '';
  });
  return result;
}

export function parseObjValueInputs(
  fields: HealthTestObjField[],
  inputs: Record<string, string>,
): Record<string, number> | null {
  if (fields.length === 0) return null;
  const result: Record<string, number> = {};
  for (const field of fields) {
    const raw = inputs[field.key]?.trim() ?? '';
    if (!raw) return null;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return null;
    result[field.key] = num;
  }
  return result;
}

export function calcObjValueAverage(
  fields: HealthTestObjField[],
  objValue: Record<string, number>,
) {
  if (fields.length === 0) return null;
  const values = fields.map(field => objValue[field.key]).filter(v => Number.isFinite(v));
  if (values.length === 0) return null;
  const sum = values.reduce((acc, item) => acc + item, 0);
  return Number((sum / values.length).toFixed(4));
}

export function parseObjValueByFields(
  fields: HealthTestObjField[],
  objValue?: Record<string, number | string | null> | null,
): Record<string, number> {
  if (!objValue || typeof objValue !== 'object' || fields.length === 0) return {};
  const result: Record<string, number> = {};
  for (const field of fields) {
    const raw = objValue[field.key];
    if (raw == null || raw === '') continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) continue;
    result[field.key] = num;
  }
  return result;
}

export function hasObjValueByFields(
  fields: HealthTestObjField[],
  objValue?: Record<string, number | string | null> | null,
) {
  const parsed = parseObjValueByFields(fields, objValue);
  return fields.some(field => parsed[field.key] != null);
}

/** 字段列表签名，用于依赖变化时重置输入 */
export function resolveObjValueFieldsKey(fields: HealthTestObjField[]) {
  return fields.map(field => field.key).join('|');
}

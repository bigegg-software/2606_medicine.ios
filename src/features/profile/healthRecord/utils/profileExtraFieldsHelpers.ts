import {
  buildDictLabelMap,
  DICT_TYPES,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 体能水平展示文案（字典 label 为 初级/中级/高级） */
export const FITNESS_LEVEL_DISPLAY: Record<string, string> = {
  初级: '初级（久坐少动，无规律运动习惯）',
  中级: '中级（有一定运动基础，每周1-2次）',
  高级: '高级（长期规律运动，每周3次以上）',
};

function resolveFitnessLevelShortLabel(item: DictDataItem) {
  const label = item.dictLabel?.trim() || '';
  const value = item.dictValue != null ? String(item.dictValue).trim() : '';
  if (label.includes('初级') || value.includes('初级')) return '初级';
  if (label.includes('中级') || value.includes('中级')) return '中级';
  if (label.includes('高级') || value.includes('高级')) return '高级';
  return label || value;
}

export function formatFitnessLevelDisplayLabel(item: DictDataItem) {
  const short = resolveFitnessLevelShortLabel(item);
  return FITNESS_LEVEL_DISPLAY[short] ?? (item.dictLabel?.trim() || String(item.dictValue ?? ''));
}

export function resolveFitnessLevelLabel(
  value?: string | null,
  items?: DictDataItem[] | null,
) {
  if (!value) return '';
  const found = (items ?? []).find(item => String(item.dictValue) === String(value));
  if (found) return formatFitnessLevelDisplayLabel(found);
  return FITNESS_LEVEL_DISPLAY[value] ?? value;
}

export function resolveTrainingGoalLabels(
  values?: string[] | null,
  labelMap?: Record<string, string>,
) {
  if (!values?.length) return '';
  return values
    .map(value => labelMap?.[String(value)] ?? String(value))
    .filter(Boolean)
    .join('、');
}

export function normalizeTrainingGoals(value?: string[] | string | null): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,，、]/).map(item => item.trim()).filter(Boolean);
  }
  return [];
}

async function loadDictItems(dictType: string) {
  try {
    const res = await getDictDataByType(dictType);
    if (!isResourceApiOk(res as unknown as { code?: number })) return [] as DictDataItem[];
    const data = apiResourceData<DictDataItem[]>(res as unknown as { code?: number; data?: DictDataItem[] });
    return Array.isArray(data) ? data : [];
  } catch {
    return [] as DictDataItem[];
  }
}

export async function loadFitnessLevelDictItems() {
  return loadDictItems(DICT_TYPES.fitnessLevel);
}

export async function loadTrainingGoalDictItems() {
  return loadDictItems(DICT_TYPES.trainingGoal);
}

export function buildFitnessLevelPickerData(items: DictDataItem[]) {
  return items
    .filter(item => item.dictValue != null && String(item.dictValue).trim() !== '')
    .map(item => ({
      label: formatFitnessLevelDisplayLabel(item),
      value: String(item.dictValue),
    }));
}

export function buildTrainingGoalOptions(items: DictDataItem[]) {
  return items
    .filter(item => item.dictValue != null && String(item.dictValue).trim() !== '')
    .map(item => ({
      label: item.dictLabel?.trim() || String(item.dictValue),
      value: String(item.dictValue),
    }));
}

export function buildTrainingGoalLabelMap(items: DictDataItem[]) {
  return buildDictLabelMap(items);
}

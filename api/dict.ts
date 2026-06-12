import request from '@/utils/axios';

export type DictDataItem = {
  dictCode?: number;
  dictSort?: number;
  dictLabel?: string;
  dictValue?: string;
  dictType?: string;
  cssClass?: string;
  listClass?: string;
  isDefault?: string;
  remark?: string;
  createTime?: string;
};

export type DictDataListResult = {
  code?: number;
  msg?: string;
  data?: DictDataItem[];
};

export const DICT_TYPES = {
  relationType: 'relation_type',
  drugAmountUnit: 'drug_amount_unit',
  medicationEventBased: 'medication_event_based',
  exerciseType: 'exercise_type',
  strengthLevel: 'strength_level',
  cardioChildType: 'cardio_child_type',
  strengthChildType: 'strength_child_type',
  flexibilityChildType: 'flexibility_child_type',
  balanceChildType: 'balance_child_type',
} as const;

export const EXERCISE_CHILD_DICT_BY_TYPE: Record<string, string> = {
  cardio: DICT_TYPES.cardioChildType,
  strength: DICT_TYPES.strengthChildType,
  flexibility: DICT_TYPES.flexibilityChildType,
  balance: DICT_TYPES.balanceChildType,
};

export function buildDictLabelMap(items?: DictDataItem[] | null): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of items ?? []) {
    if (item.dictValue != null && item.dictLabel) {
      map[String(item.dictValue)] = item.dictLabel;
    }
  }
  return map;
}

export const getDictDataByType = (dictType: string) =>
  request.get<DictDataListResult>(`/system/dict/data/type/${dictType}`);

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
  diseaseType: 'disease_type',
  relationType: 'relation_type',
  drugAmountUnit: 'drug_amount_unit',
  medicationEventBased: 'medication_event_based',
  exerciseType: 'exercise_type',
  strengthLevel: 'strength_level',
  cardioChildType: 'cardio_child_type',
  strengthChildType: 'strength_child_type',
  flexibilityChildType: 'flexibility_child_type',
  balanceChildType: 'balance_child_type',
  /** 运动部位（旧） */
  exerciseBodyPart: 'exercise_body_part',
  /** 区域块/锻炼部位（新，对应视频 regionBlock） */
  regionBlock: 'region_block',
  /** 视频动作类型：home / in_store / cert_unlock */
  exVideoActionType: 'ex_video_action_type',
  /** 视频来源库 */
  exVideoSourceLibrary: 'ex_video_source_library',
  /** 视频器械/形式 */
  exVideoEquipmentForm: 'ex_video_equipment_form',
  /** 视频动作级别 */
  exVideoActionLevel: 'ex_video_action_level',
  courseType: 'course_type',
  /** 课程分类 */
  courseCategory: 'course_category',
  liveType: 'live_type',
  livePlatform: 'live_platform',
  activityType: 'activity_type',
  /** 健康目标分类 */
  targetCategory: 'target_category',
  /** 体能水平 */
  fitnessLevel: 'fitness_level',
  /** 训练目标 */
  trainingGoal: 'training_goal',
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

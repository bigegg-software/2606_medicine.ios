import type { ImageSourcePropType } from 'react-native';
import type { QuestionnaireType } from '@/api/questionTemplate';

export type FamilyVitalItem = {
  key: string;
  label: string;
  value: string;
  /** 如血糖餐前/餐后，小号字展示 */
  valueSuffix?: string;
  icon: ImageSourcePropType;
};

/** 家人数据页体征监测静态列表 */
export const FAMILY_VITAL_ITEMS: FamilyVitalItem[] = [
  {
    key: 'bp',
    label: '血压',
    value: '142/92',
    icon: require('@/assets/family/data/bp.png'),
  },
  {
    key: 'glucose',
    label: '血糖',
    value: '5.6',
    icon: require('@/assets/family/data/glucose.png'),
  },
  {
    key: 'hr',
    label: '心率',
    value: '72',
    icon: require('@/assets/family/data/hr.png'),
  },
  {
    key: 'sleep',
    label: '睡眠',
    value: '7.5h',
    icon: require('@/assets/family/data/sleep.png'),
  },
  {
    key: 'spo2',
    label: '血氧',
    value: '98%',
    icon: require('@/assets/family/data/spo2.png'),
  },
  {
    key: 'temp',
    label: '体温',
    value: '36.5',
    icon: require('@/assets/family/data/temp.png'),
  },
  {
    key: 'uric',
    label: '尿酸',
    value: '320',
    icon: require('@/assets/family/data/uric.png'),
  },
  {
    key: 'lipid',
    label: '血脂',
    value: '4.8',
    icon: require('@/assets/family/data/lipid.png'),
  },
  {
    key: 'weight',
    label: '体重',
    value: '65.0',
    icon: require('@/assets/family/data/weight.png'),
  },
];

export function chunkFamilyVitalRows<T>(items: T[], size = 3): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export type FamilyPrescriptionTypeItem = {
  key: string;
  title: string;
  progress: number;
  progressColor: string;
  icon: ImageSourcePropType;
};

/** 家人数据页运动处方类型静态列表（参考日程今日任务） */
export const FAMILY_PRESCRIPTION_TYPES: FamilyPrescriptionTypeItem[] = [
  {
    key: 'cardio',
    title: '有氧心肺',
    progress: 60,
    progressColor: '#6D925E',
    icon: require('@/assets/images/schedule/exercise3.png'),
  },
  {
    key: 'strength',
    title: '抗阻增肌',
    progress: 40,
    progressColor: '#72A1C5',
    icon: require('@/assets/images/schedule/exercise2.png'),
  },
  {
    key: 'balance',
    title: '平衡控制',
    progress: 30,
    progressColor: '#0951AE',
    icon: require('@/assets/images/schedule/exercise4.png'),
  },
  {
    key: 'flexibility',
    title: '柔韧拉伸',
    progress: 50,
    progressColor: '#EE9C44',
    icon: require('@/assets/images/schedule/exercise1.png'),
  },
];

export type FamilyMealStatusKey =
  | '达标'
  | '明显不足'
  | '基本达标'
  | '偏低'
  | '偏高'
  | '未达标';

export type FamilyMealNutritionItem = {
  key: string;
  title: string;
  titleColor: string;
  currentValue: string;
  targetValue: string;
  /** 0-100 */
  progress: number;
  progressColor: string;
  status: FamilyMealStatusKey;
  icon: ImageSourcePropType;
};

export const FAMILY_MEAL_STATUS_STYLE: Record<
  FamilyMealStatusKey,
  { color: string; backgroundColor: string; borderColor: string }
> = {
  达标: {
    color: '#6D925E',
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderColor: 'rgba(109,146,94,0.3)',
  },
  明显不足: {
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
  基本达标: {
    color: '#56A2D8',
    backgroundColor: 'rgba(86,162,216,0.06)',
    borderColor: 'rgba(86,162,216,0.3)',
  },
  偏低: {
    color: '#EE9C44',
    backgroundColor: 'rgba(238,156,68,0.06)',
    borderColor: 'rgba(238,156,68,0.3)',
  },
  偏高: {
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
  未达标: {
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
};

export type FamilyMedicationAction = 'taken' | 'remind';

export type FamilyMedicationItem = {
  key: string;
  title: string;
  /** 是否漏服 */
  missed: boolean;
  /** 右侧：今日已服 / 提醒 */
  action: FamilyMedicationAction;
  icon: ImageSourcePropType;
};

/** 家人数据页用药记录静态列表 */
export const FAMILY_MEDICATION_ITEMS: FamilyMedicationItem[] = [
  {
    key: 'bp-drug',
    title: '降压药 (氨氯地平）',
    missed: false,
    action: 'taken',
    icon: require('@/assets/family/data/med.png'),
  },
  {
    key: 'glucose-drug',
    title: '降糖药 (二甲双胍）',
    missed: true,
    action: 'remind',
    icon: require('@/assets/family/data/med.png'),
  },
  {
    key: 'lipid-drug',
    title: '调脂药 (阿托伐他汀）',
    missed: true,
    action: 'taken',
    icon: require('@/assets/family/data/med.png'),
  },
];

/** 家人数据页用餐记录营养静态列表（参考用药页用餐） */
export const FAMILY_MEAL_NUTRITION_ITEMS: FamilyMealNutritionItem[] = [
  {
    key: 'calorie',
    title: '热量',
    titleColor: '#6D925E',
    currentValue: '1150',
    targetValue: '1600千卡',
    progress: 72,
    progressColor: '#6D925E',
    status: '偏低',
    icon: require('@/assets/family/data/meal_calorie.png'),
  },
  {
    key: 'protein',
    title: '蛋白质',
    titleColor: '#0951AE',
    currentValue: '55',
    targetValue: '80克',
    progress: 69,
    progressColor: '#0951AE',
    status: '明显不足',
    icon: require('@/assets/family/data/meal_protein.png'),
  },
  {
    key: 'carbs',
    title: '碳水',
    titleColor: '#72A1C5',
    currentValue: '180',
    targetValue: '200克',
    progress: 90,
    progressColor: '#72A1C5',
    status: '达标',
    icon: require('@/assets/family/data/meal_carbs.png'),
  },
  {
    key: 'fat',
    title: '脂肪',
    titleColor: '#FB4550',
    currentValue: '45',
    targetValue: '50克',
    progress: 90,
    progressColor: '#FB4550',
    status: '基本达标',
    icon: require('@/assets/family/data/meal_fat.png'),
  },
];

export type FamilyAssessmentItem = {
  key: string;
  title: string;
  /** 如：中风险（2026-08-12） */
  subtitle: string;
  /** 问卷记录 id，便于跳转详情 */
  recordId?: string;
  /** 问卷类型，跳转结果页用 */
  type?: QuestionnaireType;
};

/** 家人数据页评估结果静态列表 */
export const FAMILY_ASSESSMENT_ITEMS: FamilyAssessmentItem[] = [
  {
    key: 'health-risk',
    title: '健康风险评估',
    subtitle: '中风险（2026-08-12）',
  },
  {
    key: 'chronic-risk',
    title: '慢病风险评估',
    subtitle: '低风险（2026-07-20）',
  },
];

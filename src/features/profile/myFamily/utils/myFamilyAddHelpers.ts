import type { ImageSourcePropType } from 'react-native';

export type FamilyPermissionKey =
  | 'health'
  | 'medication'
  | 'exercise'
  | 'diet'
  | 'chronic'
  | 'assessment'
  | 'alert'
  | 'emergency';

export type FamilyPermissionOption = {
  key: FamilyPermissionKey;
  title: string;
  icon: ImageSourcePropType;
};

export type FamilyPermissionDetailOption = FamilyPermissionOption & {
  /** 详情页完整标题 */
  detailTitle: string;
  /** 详情页副标题 */
  detailDesc: string;
};

export const FAMILY_PERMISSION_OPTIONS: FamilyPermissionOption[] = [
  {
    key: 'health',
    title: '健康数据',
    icon: require('@/assets/images/family/icon_jk.png'),
  },
  {
    key: 'medication',
    title: '用药情况',
    icon: require('@/assets/images/family/icon_yy.png'),
  },
  {
    key: 'exercise',
    title: '运动情况',
    icon: require('@/assets/images/family/icon_yd.png'),
  },
  {
    key: 'diet',
    title: '饮食情况',
    icon: require('@/assets/images/family/icon_ys.png'),
  },
  {
    key: 'chronic',
    title: '慢病管理',
    icon: require('@/assets/images/family/icon_mb.png'),
  },
  {
    key: 'assessment',
    title: '评估结果',
    icon: require('@/assets/images/family/icon_pg.png'),
  },
  {
    key: 'alert',
    title: '健康预警',
    icon: require('@/assets/images/family/icon_yj.png'),
  },
  {
    key: 'emergency',
    title: '紧急联系',
    icon: require('@/assets/images/family/icon_jj.png'),
  },
];

const DETAIL_COPY: Record<FamilyPermissionKey, { detailTitle: string; detailDesc: string }> = {
  health: {
    detailTitle: '查看健康数据',
    detailDesc: '血压/血糖/心率',
  },
  medication: {
    detailTitle: '查看用药情况',
    detailDesc: '药品名称/服用记录',
  },
  exercise: {
    detailTitle: '查看运动情况',
    detailDesc: '步数/运动记录',
  },
  diet: {
    detailTitle: '查看饮食情况',
    detailDesc: '饮食记录/营养摄入',
  },
  chronic: {
    detailTitle: '查看慢病管理',
    detailDesc: '高血压 · 糖尿病 · 近期稳定',
  },
  assessment: {
    detailTitle: '查看评估结果',
    detailDesc: '含健康问卷、心理评估、风险测评',
  },
  alert: {
    detailTitle: '接收健康预警',
    detailDesc: '异常指标实时推送',
  },
  emergency: {
    detailTitle: '紧急联系权限',
    detailDesc: '紧急联系人/一键呼叫',
  },
};

export const FAMILY_PERMISSION_DETAIL_OPTIONS: FamilyPermissionDetailOption[] =
  FAMILY_PERMISSION_OPTIONS.map(item => ({
    ...item,
    ...DETAIL_COPY[item.key],
  }));

export function toggleFamilyPermission(
  selected: FamilyPermissionKey[],
  key: FamilyPermissionKey,
): FamilyPermissionKey[] {
  return selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key];
}

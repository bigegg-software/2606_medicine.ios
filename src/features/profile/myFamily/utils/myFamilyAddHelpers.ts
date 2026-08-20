import type { ImageSourcePropType } from 'react-native';

/** 授权权限英文编码（与接口 authPermissions 一致） */
export type FamilyPermissionKey =
  | 'health_data'
  | 'medication'
  | 'exercise'
  | 'diet'
  | 'chronic_disease'
  | 'assessment'
  | 'health_alert';

export type FamilyPermissionOption = {
  key: FamilyPermissionKey;
  title: string;
  shortLabel: string;
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
    key: 'health_data',
    title: '健康数据',
    shortLabel: '健康',
    icon: require('@/assets/images/family/icon_jk.png'),
  },
  {
    key: 'medication',
    title: '用药情况',
    shortLabel: '用药',
    icon: require('@/assets/images/family/icon_yy.png'),
  },
  {
    key: 'exercise',
    title: '运动情况',
    shortLabel: '运动',
    icon: require('@/assets/images/family/icon_yd.png'),
  },
  {
    key: 'diet',
    title: '饮食情况',
    shortLabel: '饮食',
    icon: require('@/assets/images/family/icon_ys.png'),
  },
  {
    key: 'chronic_disease',
    title: '慢病管理',
    shortLabel: '慢病',
    icon: require('@/assets/images/family/icon_mb.png'),
  },
  {
    key: 'assessment',
    title: '评估结果',
    shortLabel: '评估',
    icon: require('@/assets/images/family/icon_pg.png'),
  },
  {
    key: 'health_alert',
    title: '健康预警',
    shortLabel: '预警',
    icon: require('@/assets/images/family/icon_yj.png'),
  },
];

const DETAIL_COPY: Record<FamilyPermissionKey, { detailTitle: string; detailDesc: string }> = {
  health_data: {
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
  chronic_disease: {
    detailTitle: '查看慢病管理',
    detailDesc: '高血压 · 糖尿病 · 近期稳定',
  },
  assessment: {
    detailTitle: '查看评估结果',
    detailDesc: '含健康问卷、心理评估、风险测评',
  },
  health_alert: {
    detailTitle: '接收健康预警',
    detailDesc: '异常指标实时推送',
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

export function areAllFamilyPermissionsSelected(selected: FamilyPermissionKey[]): boolean {
  return FAMILY_PERMISSION_OPTIONS.every(item => selected.includes(item.key));
}

export function toggleAllFamilyPermissions(
  selected: FamilyPermissionKey[],
): FamilyPermissionKey[] {
  return areAllFamilyPermissionsSelected(selected)
    ? []
    : FAMILY_PERMISSION_OPTIONS.map(item => item.key);
}

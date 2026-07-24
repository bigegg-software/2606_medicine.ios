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

export function toggleFamilyPermission(
  selected: FamilyPermissionKey[],
  key: FamilyPermissionKey,
): FamilyPermissionKey[] {
  return selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key];
}

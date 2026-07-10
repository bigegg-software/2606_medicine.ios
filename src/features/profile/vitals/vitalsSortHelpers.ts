import type { ImageSourcePropType } from 'react-native';

export const VITAL_INDEX_KEYS = [
  '心率',
  '消耗',
  '血糖',
  '血压',
  '步数',
  '睡眠',
  '血氧',
  '体温',
  '体重',
  '血脂',
  '尿酸',
] as const;

export type VitalIndexKey = typeof VITAL_INDEX_KEYS[number];

export type VitalsSortItem = {
  key: VitalIndexKey;
  status: string;
  statusColor: string;
};

export const VITAL_INDEX_ICONS: Record<VitalIndexKey, ImageSourcePropType> = {
  心率: require('@/assets/images/vitals/icon_xl.png'),
  消耗: require('@/assets/images/vitals/icon_xh.png'),
  血糖: require('@/assets/images/vitals/icon_xt.png'),
  血压: require('@/assets/images/vitals/icon_xy.png'),
  步数: require('@/assets/images/vitals/icon_bs.png'),
  睡眠: require('@/assets/images/vitals/icon_sleep.png'),
  血氧: require('@/assets/images/vitals/icon_o2.png'),
  体温: require('@/assets/images/vitals/icon_tw.png'),
  体重: require('@/assets/images/vitals/icon_tz.png'),
  血脂: require('@/assets/images/vitals/icon_xz.png'),
  尿酸: require('@/assets/images/vitals/icon_ns.png'),
};

export function isVitalIndexKey(value: string): value is VitalIndexKey {
  return (VITAL_INDEX_KEYS as readonly string[]).includes(value);
}

export function resolveVitalsDisplayOrder(savedList?: string[] | null): VitalIndexKey[] {
  if (!savedList?.length) {
    return [...VITAL_INDEX_KEYS];
  }

  const valid = savedList.filter(isVitalIndexKey);
  const missing = VITAL_INDEX_KEYS.filter(key => !valid.includes(key));
  return [...valid, ...missing];
}

export function normalizeVitalsSortItems(items?: VitalsSortItem[] | null): VitalsSortItem[] {
  const order = resolveVitalsDisplayOrder(items?.map(item => item.key));
  const itemMap = new Map((items ?? []).map(item => [item.key, item]));

  return order.map(key => itemMap.get(key) ?? {
    key,
    status: '',
    statusColor: '#999999',
  });
}

export function formatVitalsSortStatus(status?: string) {
  return status?.replace(/^・/, '').trim() ?? '';
}

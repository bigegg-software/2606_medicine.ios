import type { PickerColumnItem } from '@ant-design/react-native/lib/picker-view/PropsType';

/** china-division/dist/pcas.json：省 → 市 → 区县 → 街道[] */
export type PcasRaw = Record<string, Record<string, Record<string, string[]>>>;

export type RegionSelection = {
  province: string;
  city: string;
  district: string;
  street: string;
};

/** 直辖市：数据里城市名为「市辖区」，展示/回传用省名 */
const MUNICIPALITY_PROVINCES = new Set(['北京市', '天津市', '上海市', '重庆市']);

let cachedOptions: PickerColumnItem[] | null = null;

export function isMunicipalityProvince(province: string): boolean {
  return MUNICIPALITY_PROVINCES.has(province);
}

/** 展示用：市辖区 → 北京市；兼容历史值仍为「市辖区」 */
export function displayCityName(province: string, city: string): string {
  if (city === '市辖区' && isMunicipalityProvince(province)) {
    return province;
  }
  return city;
}

/** 匹配级联数据时：历史「市辖区」与展示后的省名都能对应到同一列 */
export function normalizeCityForPicker(province: string, city: string): string {
  return displayCityName(province, city);
}

function convertPcasToPickerData(raw: PcasRaw): PickerColumnItem[] {
  return Object.keys(raw).map(province => {
    const cities = raw[province] ?? {};
    return {
      label: province,
      value: province,
      children: Object.keys(cities).map(cityKey => {
        const cityLabel = displayCityName(province, cityKey);
        const districts = cities[cityKey] ?? {};
        return {
          label: cityLabel,
          value: cityLabel,
          children: Object.keys(districts).map(district => {
            const streets = districts[district] ?? [];
            return {
              label: district,
              value: district,
              children: streets.map(street => ({
                label: street,
                value: street,
              })),
            };
          }),
        };
      }),
    };
  });
}

/** 动态加载 china-division 四级数据并缓存 */
export async function loadChinaRegionData(): Promise<PickerColumnItem[]> {
  if (cachedOptions) {
    return cachedOptions;
  }
  const module = await import('china-division/dist/pcas.json');
  const raw = ((module as { default?: PcasRaw }).default ?? module) as PcasRaw;
  cachedOptions = convertPcasToPickerData(raw);
  return cachedOptions;
}

export function regionSelectionFromParts(
  province?: string,
  city?: string,
  district?: string,
  street?: string,
): RegionSelection | undefined {
  if (!province?.trim()) {
    return undefined;
  }
  return {
    province: province.trim(),
    city: normalizeCityForPicker(province.trim(), (city ?? '').trim()),
    district: (district ?? '').trim(),
    street: (street ?? '').trim(),
  };
}

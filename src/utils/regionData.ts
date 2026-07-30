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
let cachedRaw: PcasRaw | null = null;

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

async function loadPcasRaw(): Promise<PcasRaw> {
  if (cachedRaw) {
    return cachedRaw;
  }
  const module = await import('china-division/dist/pcas.json');
  cachedRaw = ((module as { default?: PcasRaw }).default ?? module) as PcasRaw;
  return cachedRaw;
}

/** 动态加载 china-division 四级数据并缓存 */
export async function loadChinaRegionData(): Promise<PickerColumnItem[]> {
  if (cachedOptions) {
    return cachedOptions;
  }
  const raw = await loadPcasRaw();
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

function findPrefectureCityKey(
  province: string,
  provinceData: Record<string, Record<string, string[]>>,
  cityName: string,
): string | null {
  if (!cityName) return null;
  if (provinceData[cityName]) return cityName;
  // 直辖市展示名 → 市辖区
  if (isMunicipalityProvince(province) && cityName === province && provinceData['市辖区']) {
    return '市辖区';
  }
  for (const cityKey of Object.keys(provinceData)) {
    if (displayCityName(province, cityKey) === cityName) {
      return cityKey;
    }
  }
  return null;
}

/**
 * 将身份证识别出的省市区街道对齐到 china-division 四级结构。
 * 兼容县级市被识别为「市」的情况（如 河北省/新乐市/承安镇 → 河北省/石家庄市/新乐市/承安镇）。
 */
export function resolveRegionAgainstPcas(
  raw: PcasRaw,
  parts: {
    province?: string;
    city?: string;
    district?: string;
    street?: string;
  },
): RegionSelection {
  const province = parts.province?.trim() ?? '';
  let city = parts.city?.trim() ?? '';
  let district = parts.district?.trim() ?? '';
  let street = parts.street?.trim() ?? '';

  if (!province) {
    return { province, city, district, street };
  }

  const provinceData = raw[province];
  if (!provinceData) {
    return { province, city, district, street };
  }

  const prefectureKey = findPrefectureCityKey(province, provinceData, city);
  if (prefectureKey) {
    return {
      province,
      city: displayCityName(province, prefectureKey),
      district,
      street,
    };
  }

  // city 实际是县级市/区县：挂在某地级市下
  if (city) {
    for (const [prefKey, districts] of Object.entries(provinceData)) {
      const streets = districts[city];
      if (!streets) continue;

      let nextStreet = street;
      // 识别常把镇/街道放在 district；上移到 street
      if (!nextStreet && district && district !== city) {
        nextStreet = district;
      } else if (
        district
        && district !== city
        && streets.includes(district)
        && (!street || street === district)
      ) {
        nextStreet = district;
      }

      return {
        province,
        city: displayCityName(province, prefKey),
        district: city,
        street: nextStreet,
      };
    }
  }

  // district 是县级市，city 为空或无法匹配
  if (district) {
    for (const [prefKey, districts] of Object.entries(provinceData)) {
      if (!districts[district]) continue;
      return {
        province,
        city: displayCityName(province, prefKey),
        district,
        street,
      };
    }
  }

  return { province, city, district, street };
}

/** 异步解析居住地区，兼容县级市等识别结果 */
export async function resolveResidentialRegion(parts: {
  province?: string;
  city?: string;
  district?: string;
  street?: string;
}): Promise<RegionSelection> {
  const raw = await loadPcasRaw();
  return resolveRegionAgainstPcas(raw, parts);
}

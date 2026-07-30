import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeOption = 'standard' | 'larger' | 'xlarge' | 'max';

const STORAGE_KEY = 'appFontSize';

export const FONT_SIZE_OPTIONS: { key: FontSizeOption; label: string; scale: number }[] = [
  { key: 'standard', label: '标准', scale: 1 },
  { key: 'larger', label: '较大', scale: 1.15 },
  { key: 'xlarge', label: '超大', scale: 1.3 },
  { key: 'max', label: '最大', scale: 1.45 },
];

const LEGACY_OPTION_MAP: Record<string, FontSizeOption> = {
  small: 'standard',
  medium: 'larger',
  large: 'xlarge',
};

export function getFontSizeLabel(option: FontSizeOption) {
  return FONT_SIZE_OPTIONS.find(item => item.key === option)?.label ?? '标准';
}

export function getFontSizeScale(option: FontSizeOption) {
  return FONT_SIZE_OPTIONS.find(item => item.key === option)?.scale ?? 1;
}

export function getFontSizeOptionIndex(option: FontSizeOption) {
  const index = FONT_SIZE_OPTIONS.findIndex(item => item.key === option);
  return index >= 0 ? index : 0;
}

function normalizeFontSizeOption(value: string | null): FontSizeOption {
  if (!value) return 'standard';
  if (value === 'standard' || value === 'larger' || value === 'xlarge' || value === 'max') {
    return value;
  }
  return LEGACY_OPTION_MAP[value] ?? 'standard';
}

export async function getFontSizeOption(): Promise<FontSizeOption> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return normalizeFontSizeOption(value);
}

export async function setFontSizeOption(option: FontSizeOption) {
  await AsyncStorage.setItem(STORAGE_KEY, option);
}

export function scaleFontSize(size: number, option: FontSizeOption) {
  return Math.round(size * getFontSizeScale(option));
}

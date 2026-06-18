import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeOption = 'small' | 'medium' | 'large';

const STORAGE_KEY = 'appFontSize';

export const FONT_SIZE_OPTIONS: { key: FontSizeOption; label: string; scale: number }[] = [
    { key: 'small', label: '小', scale: 1 },
    { key: 'medium', label: '中', scale: 1.15 },
    { key: 'large', label: '大', scale: 1.3 },
];

export function getFontSizeLabel(option: FontSizeOption) {
    return FONT_SIZE_OPTIONS.find(item => item.key === option)?.label ?? '小';
}

export function getFontSizeScale(option: FontSizeOption) {
    return FONT_SIZE_OPTIONS.find(item => item.key === option)?.scale ?? 1;
}

export async function getFontSizeOption(): Promise<FontSizeOption> {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value === 'small' || value === 'medium' || value === 'large') {
        return value;
    }
    return 'small';
}

export async function setFontSizeOption(option: FontSizeOption) {
    await AsyncStorage.setItem(STORAGE_KEY, option);
}

export function scaleFontSize(size: number, option: FontSizeOption) {
    return Math.round(size * getFontSizeScale(option));
}

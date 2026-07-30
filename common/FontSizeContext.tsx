import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    getFontSizeLabel,
    getFontSizeOption,
    getFontSizeScale,
    scaleFontSize,
    setFontSizeOption as persistFontSizeOption,
    type FontSizeOption,
} from '@/common/fontSize';

type FontSizeContextValue = {
    option: FontSizeOption;
    scale: number;
    label: string;
    scaleSize: (size: number) => number;
    setOption: (option: FontSizeOption) => Promise<void>;
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
    const [option, setOptionState] = useState<FontSizeOption>('standard');

    useEffect(() => {
        getFontSizeOption().then(setOptionState);
    }, []);

    const setOption = useCallback(async (next: FontSizeOption) => {
        setOptionState(next);
        await persistFontSizeOption(next);
    }, []);

    const scale = getFontSizeScale(option);

    const value = useMemo<FontSizeContextValue>(
        () => ({
            option,
            scale,
            label: getFontSizeLabel(option),
            scaleSize: (size: number) => scaleFontSize(size, option),
            setOption,
        }),
        [option, scale, setOption],
    );

    return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
}

export function useFontSize() {
    const ctx = useContext(FontSizeContext);
    if (!ctx) {
        throw new Error('useFontSize must be used within FontSizeProvider');
    }
    return ctx;
}

import React, { useMemo } from 'react';
import {
    StyleSheet,
    TextInput as RNTextInput,
    type StyleProp,
    type TextInputProps,
    type TextStyle,
} from 'react-native-original';
import { useFontSize } from '@/common/FontSizeContext';

function scaleStyle(style: StyleProp<TextStyle>, scale: number): StyleProp<TextStyle> {
    if (scale === 1 || !style) {
        return style;
    }

    const flat = StyleSheet.flatten(style);
    if (!flat || typeof flat.fontSize !== 'number') {
        return style;
    }

    const patch: TextStyle = {
        fontSize: Math.round(flat.fontSize * scale),
    };

    if (typeof flat.lineHeight === 'number') {
        patch.lineHeight = Math.round(flat.lineHeight * scale);
    }

    return [style, patch];
}

export default function ScaledTextInput(props: TextInputProps) {
    const { scale } = useFontSize();
    const scaledStyle = useMemo(() => scaleStyle(props.style, scale), [props.style, scale]);

    return <RNTextInput {...props} allowFontScaling={false} style={scaledStyle} />;
}

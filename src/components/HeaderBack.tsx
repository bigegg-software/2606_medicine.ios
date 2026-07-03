import React, { useMemo } from 'react';
import { Image, StyleSheet, Dimensions, View, type ImageSourcePropType } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_BG_SOURCE = require('@/assets/images/bg.png');
const DEFAULT_BG_ASPECT_HEIGHT = (SCREEN_WIDTH * 471) / 375;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        zIndex: 0,
    },
    backImg: {
        width: SCREEN_WIDTH,
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

type Props = {
    source?: ImageSourcePropType;
};

function resolveBackgroundHeight(source: ImageSourcePropType, fallback: number) {
    const resolved = Image.resolveAssetSource(source);
    if (resolved?.width && resolved?.height) {
        return (SCREEN_WIDTH * resolved.height) / resolved.width;
    }
    return fallback;
}

export default function HeaderBack({ source = DEFAULT_BG_SOURCE }: Props) {
    const height = useMemo(
        () => resolveBackgroundHeight(source, DEFAULT_BG_ASPECT_HEIGHT),
        [source],
    );

    return (
        <View style={styles.container} pointerEvents="none">
            <Image source={source} style={[styles.backImg, { height }]} resizeMode="cover" />
        </View>
    );
}

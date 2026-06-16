import React from 'react';
import { Image, StyleSheet, Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BG_ASPECT_HEIGHT = (SCREEN_WIDTH * 471) / 375;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        zIndex: 0,
    },
    backImg: {
        width: SCREEN_WIDTH,
        height: BG_ASPECT_HEIGHT,
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

export default function HeaderBack() {
    return (
        <View style={styles.container} pointerEvents="none">
            <Image source={require('@/assets/images/bg.png')} style={styles.backImg} />
        </View>
    );
}

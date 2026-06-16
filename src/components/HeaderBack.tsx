import React from 'react';
import { Image, StyleSheet, Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        zIndex: 0,
    },
    backImg: {
        width: SCREEN_WIDTH,
        height: 471,
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

import React, { type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { AppTheme } from '@/common/theme';
import HeaderBack from './HeaderBack';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundColor,
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
});

type Props = {
    children: ReactNode;
    edges?: Edge[];
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
};

export default function PageLayout({ children, edges = ['bottom'], style, contentStyle }: Props) {
    const headerHeight = useHeaderHeight();

    return (
        <SafeAreaView style={[styles.container, style]} edges={edges}>
            <HeaderBack />
            <View style={[styles.content, { paddingTop: headerHeight }, contentStyle]}>
                {children}
            </View>
        </SafeAreaView>
    );
}

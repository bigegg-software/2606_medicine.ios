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
    /** Stack 页为 true（预留导航栏高度）；Tab 页为 false */
    withStackHeader?: boolean;
};

export default function PageLayout({
    children,
    edges = ['bottom'],
    style,
    contentStyle,
    withStackHeader = true,
}: Props) {
    const headerHeight = useHeaderHeight();

    return (
        <SafeAreaView style={[styles.container, style]} edges={edges}>
            <HeaderBack />
            <View
                style={[
                    styles.content,
                    withStackHeader ? { paddingTop: headerHeight } : null,
                    contentStyle,
                ]}>
                {children}
            </View>
        </SafeAreaView>
    );
}

export function TabPageLayout({
    children,
    style,
    contentStyle,
}: Omit<Props, 'edges' | 'withStackHeader'>) {
    return (
        <PageLayout edges={['top']} withStackHeader={false} style={style} contentStyle={contentStyle}>
            {children}
        </PageLayout>
    );
}

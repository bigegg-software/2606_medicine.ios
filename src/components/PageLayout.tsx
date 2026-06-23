import React, { type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { AppTheme } from '@/common/theme';
import HeaderBack from './HeaderBack';
import UploadProgressBar from './UploadProgressBar';

const STACK_HEADER_CONTENT_HEIGHT = 44;

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
    const insets = useSafeAreaInsets();
    const topPadding = withStackHeader
        ? (headerHeight > 0 ? headerHeight : insets.top + STACK_HEADER_CONTENT_HEIGHT)
        : 0;

    return (
        <SafeAreaView style={[styles.container, style]} edges={edges}>
            <HeaderBack />
            <View
                style={[
                    styles.content,
                    topPadding > 0 ? { paddingTop: topPadding } : null,
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
        <PageLayout withStackHeader style={style} contentStyle={contentStyle}>
            <UploadProgressBar />
            {children}
        </PageLayout>
    );
}

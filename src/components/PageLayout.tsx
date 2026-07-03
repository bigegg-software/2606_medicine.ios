import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { AppTheme } from '@/common/theme';
import HeaderBack from './HeaderBack';
import UploadProgressBar from './UploadProgressBar';

const STACK_HEADER_CONTENT_HEIGHT = 44;

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    /** 键盘「完成」工具栏，需挂在 SafeAreaView 顶层以保证 iOS InputAccessoryView 及时显示 */
    keyboardAccessory?: ReactNode;
    /** 自定义顶部背景图，默认使用全局 bg.png；showHeaderBackground 为 false 时不渲染 */
    headerBackSource?: ImageSourcePropType;
    /** 为 false 时页面顶部使用 #FFFFFF，不显示背景图 */
    showHeaderBackground?: boolean;
};

export default function PageLayout({
    children,
    edges = ['bottom'],
    style,
    contentStyle,
    withStackHeader = true,
    keyboardAccessory,
    headerBackSource,
    showHeaderBackground = true,
}: Props) {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const topPadding = withStackHeader
        ? (headerHeight > 0 ? headerHeight : insets.top + STACK_HEADER_CONTENT_HEIGHT)
        : 0;

    return (
        <SafeAreaView
            style={[
                styles.container,
                style,
            ]}
            edges={edges}>
            {showHeaderBackground ? <HeaderBack source={headerBackSource} /> : null}
            <View
                style={[
                    styles.content,
                    topPadding > 0 ? { paddingTop: topPadding } : null,
                    contentStyle,
                ]}>
                {children}
            </View>
            {keyboardAccessory}
        </SafeAreaView>
    );
}

export function TabPageLayout({
    children,
    style,
    contentStyle,
}: Omit<Props, 'edges' | 'withStackHeader'>) {
    return (
        <PageLayout withStackHeader edges={[]} style={style} contentStyle={contentStyle}>
            <UploadProgressBar />
            {children}
        </PageLayout>
    );
}

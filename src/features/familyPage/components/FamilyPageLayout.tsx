import React, { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import PageLayout from '@/src/components/PageLayout';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * 家人视角 Tab 页：
 * - 保留 Stack Title，内容按导航栏高度下沉
 * - 底部安全区交给 TabBar，顶部不再重复叠 SafeArea
 */
export default function FamilyPageLayout({ children, style, contentStyle }: Props) {
  return (
    <PageLayout
      withStackHeader
      edges={[]}
      style={style}
      contentStyle={contentStyle}
    >
      {children}
    </PageLayout>
  );
}

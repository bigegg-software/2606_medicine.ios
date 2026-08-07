import React, { useMemo } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { AppTheme } from '@/common/theme';
import { stripHtmlText } from '../courseHelpers';
import { parseRichHtml, renderRichHtmlBlocks } from '../utils/richHtmlHelpers';

type Props = {
  html: string;
  style?: StyleProp<ViewStyle>;
};

/** 原生富文本渲染（避免 WebView 冷启动慢） */
export default function RichHtmlView({ html, style }: Props) {
  const blocks = useMemo(() => parseRichHtml(html), [html]);
  const plainFallback = useMemo(() => stripHtmlText(html), [html]);

  if (!blocks.length) {
    if (!plainFallback) return null;
    return (
      <View style={style}>
        <Text style={{ fontSize: 14, lineHeight: 22, color: AppTheme.textPrimary }}>
          {plainFallback}
        </Text>
      </View>
    );
  }

  return <View style={style}>{renderRichHtmlBlocks(blocks)}</View>;
}

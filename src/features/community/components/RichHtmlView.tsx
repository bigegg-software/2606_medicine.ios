import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { parseRichHtml, renderRichHtmlBlocks } from '../utils/richHtmlHelpers';

type Props = {
  html: string;
  style?: StyleProp<ViewStyle>;
};

/** 原生富文本渲染（避免 WebView 冷启动慢） */
export default function RichHtmlView({ html, style }: Props) {
  const blocks = useMemo(() => parseRichHtml(html), [html]);

  return <View style={style}>{renderRichHtmlBlocks(blocks)}</View>;
}

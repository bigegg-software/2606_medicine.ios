import React, { useState } from 'react';
import { Linking, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppTheme } from '@/common/theme';
import { buildRichHtmlDocument } from '../liveHelpers';

type Props = {
  html: string;
  style?: StyleProp<ViewStyle>;
};

export default function RichHtmlView({ html, style }: Props) {
  const [height, setHeight] = useState(40);

  return (
    <WebView
      originWhitelist={['*']}
      source={{
        html: buildRichHtmlDocument(html, {
          color: AppTheme.textPrimary,
          fontSize: 14,
          lineHeight: 22,
        }),
      }}
      style={[{ width: '100%', backgroundColor: 'transparent', height }, style]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      javaScriptEnabled
      onMessage={event => {
        const next = Number(event.nativeEvent.data);
        if (!Number.isFinite(next) || next <= 0) return;
        setHeight(prev => {
          const rounded = Math.ceil(next);
          return rounded === prev ? prev : rounded;
        });
      }}
      onShouldStartLoadWithRequest={request => {
        const { url } = request;
        if (!url || url === 'about:blank' || url.startsWith('data:')) return true;
        Linking.openURL(url).catch(() => undefined);
        return false;
      }}
    />
  );
}

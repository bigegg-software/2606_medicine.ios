import React from 'react';
import { View, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import markdownStyles from '@/css/assistant/mdStyle';

export function renderAiMessageText(text: string, streaming?: boolean) {
  const content = text.trim();

  return (
    <View>
      {content ? (
        <Markdown style={markdownStyles.markdownStyles}>
          {content}
        </Markdown>
      ) : null}
      {streaming ? <Text style={markdownStyles.streamCursor}>▍</Text> : null}
    </View>
  );
}

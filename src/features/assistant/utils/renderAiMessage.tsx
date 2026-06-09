import React from 'react';
import { View, Text, type TextStyle, type ViewStyle } from 'react-native';

/** 先匹配 ***粗斜体***，再 **粗体**，最后 *斜体* */
const INLINE_PATTERN = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*)/g;

const italicSkew: ViewStyle = {
  transform: [{ skewX: '-14deg' }],
};

type EmphasisType = 'bold' | 'italic' | 'boldItalic';

function getEmphasisType(mark: string): EmphasisType | null {
  if (mark.startsWith('***') && mark.endsWith('***') && mark.length > 6) return 'boldItalic';
  if (mark.startsWith('**') && mark.endsWith('**') && mark.length > 4) return 'bold';
  if (mark.startsWith('*') && mark.endsWith('*') && mark.length > 2) return 'italic';
  return null;
}

function stripEmphasis(mark: string, type: EmphasisType): string {
  if (type === 'boldItalic') return mark.slice(3, -3);
  if (type === 'bold') return mark.slice(2, -2);
  return mark.slice(1, -1);
}

function renderEmphasis(
  content: string,
  type: EmphasisType,
  boldStyle: TextStyle,
  italicStyle: TextStyle,
  boldItalicStyle: TextStyle,
  key: string,
) {
  if (type === 'bold') {
    return (
      <Text key={key} style={boldStyle}>
        {content}
      </Text>
    );
  }

  const style = type === 'boldItalic' ? boldItalicStyle : italicStyle;
  return (
    <View key={key} style={italicSkew}>
      <Text style={style}>{content}</Text>
    </View>
  );
}

function renderLine(
  line: string,
  baseStyle: TextStyle,
  boldStyle: TextStyle,
  italicStyle: TextStyle,
  boldItalicStyle: TextStyle,
  keyPrefix: string,
) {
  const parts = line.split(INLINE_PATTERN);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {parts.map((part, index) => {
        const emphasisType = getEmphasisType(part);
        if (emphasisType) {
          return renderEmphasis(
            stripEmphasis(part, emphasisType),
            emphasisType,
            boldStyle,
            italicStyle,
            boldItalicStyle,
            `${keyPrefix}-e-${index}`,
          );
        }
        if (!part) return null;
        return (
          <Text key={`${keyPrefix}-t-${index}`} style={baseStyle}>
            {part}
          </Text>
        );
      })}
    </View>
  );
}

export function renderAiMessageText(
  text: string,
  baseStyle: TextStyle,
  boldStyle: TextStyle,
  italicStyle: TextStyle,
  boldItalicStyle: TextStyle,
  streaming?: boolean,
) {
  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, lineIndex) => (
        <View key={`line-${lineIndex}`} style={lineIndex > 0 ? { marginTop: 4 } : undefined}>
          {renderLine(line, baseStyle, boldStyle, italicStyle, boldItalicStyle, `line-${lineIndex}`)}
        </View>
      ))}
      {streaming ? <Text style={baseStyle}>▍</Text> : null}
    </View>
  );
}

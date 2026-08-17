import React from 'react';
import { View, Text, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  text?: string;
  style?: StyleProp<ViewStyle>;
  /** 卡片内紧凑空状态 */
  compact?: boolean;
};

/** 暂无记录空状态（zwjl 图） */
export default function EmptyRecord({ text = '暂无数据', style, compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <Image
        style={compact ? styles.imageCompact : styles.image}
        source={require('@/assets/images/user/zwjl.png')}
        resizeMode="contain"
      />
      <Text style={compact ? styles.textCompact : styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapCompact: {
    paddingVertical: 8,
  },
  image: {
    width: 120,
    height: 80,
  },
  imageCompact: {
    width: 72,
    height: 72,
  },
  text: {
    marginTop: 25,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  textCompact: {
    marginTop: 12,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
});

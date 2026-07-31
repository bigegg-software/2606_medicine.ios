import React from 'react';
import { View, Text, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  text?: string;
  style?: StyleProp<ViewStyle>;
};

/** 暂无记录空状态（zwjl 图） */
export default function EmptyRecord({ text = '暂无数据', style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Image
        style={styles.image}
        source={require('@/assets/images/user/zwjl.png')}
        resizeMode="contain"
      />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 120,
    height: 80,
  },
  text: {
    marginTop: 25,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
});

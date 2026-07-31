import React from 'react';
import { Text, StyleSheet, TouchableOpacity, type StyleProp, type TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';

type Props = {
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  /** 与前缀文字的间距 */
  marginLeft?: number;
};

/** 「完善个人信息」可点击链接：主题色 + 可控间距下划线 */
export default function CompleteProfileLink({ textStyle, marginLeft = 6, color = '#999999' }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ProfileEditPage')}
      style={[styles.wrap, { marginLeft, borderBottomColor: color }]}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
      <Text style={[styles.text, textStyle, { color }]}>完善个人信息</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 1,
    borderBottomWidth: 1,
  },
  text: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
});

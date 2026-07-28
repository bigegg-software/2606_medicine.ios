import React, { useCallback, useRef, useState } from 'react';
import { Alert, Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import styles from '@/css/auth/identitySelect';
import PageLayout from '@/src/components/PageLayout';
import { fetchUserSession } from '@/store/actions/user';
import type { AppDispatch } from '@/store/store';
import {
  getAuthHomeRoute,
  submitInitMemberType,
  type IdentityPerspective,
} from './utils/identityHelpers';

const IDENTITY_OPTIONS: ReadonlyArray<{
  value: IdentityPerspective;
  title: string;
  desc: string;
  icon: ImageSourcePropType;
}> = [
    {
      value: 'child',
      title: '关爱家人健康',
      desc: '实时查看家人的血压、血糖及用药情况，及时掌握健康动态。',
      icon: require('@/assets/images/login/icon1.png'),
    },
    {
      value: 'old',
      title: '安心共享健康',
      desc: '授权家人查看我的血压、血糖和用药记录，并可随时调整或撤销授权。',
      icon: require('@/assets/images/login/icon2.png'),
    },
  ];

export default function IdentitySelectPage() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSelect = useCallback(
    async (value: IdentityPerspective) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        const result = await submitInitMemberType(value);
        if (!result.ok) {
          Alert.alert('提交失败', result.msg ?? '请稍后重试');
          return;
        }
        await dispatch(fetchUserSession());
        const homeRoute = result.homeRoute || getAuthHomeRoute(value);
        navigation.reset({
          index: 0,
          routes: [{ name: homeRoute }],
        });
      } catch {
        Alert.alert('错误', '网络错误，请稍后重试');
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [dispatch, navigation],
  );

  return (
    <PageLayout style={styles.container} withStackHeader={false}>
      <View style={styles.body}>
        <View style={styles.centerWrap}>
          <View style={styles.centerBox}>
            <Text style={styles.title}>欢迎使用莱益晟</Text>
            <Text style={styles.subtitle}>您想先做什么？</Text>

            {IDENTITY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                disabled={submitting}
                style={[styles.optionBtn, submitting && styles.optionBtnDisabled]}
                onPress={() => handleSelect(option.value)}>
                <Flex align="center" style={{ flex: 1 }}>
                  <Image style={styles.optionIcon} source={option.icon} />
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionText}>{option.title}</Text>
                    <Text style={styles.optionDesc}>{option.desc}</Text>
                  </View>
                </Flex>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Flex justify="center" align="center" style={styles.warnBar}>
          <Image style={styles.warnIcon} source={require('@/assets/images/login/warn.png')} />
          <Text style={styles.warnText}>
            后续可在 <Text style={styles.warnTextLink}>设置</Text> 中切换身份
          </Text>
        </Flex>
      </View>
    </PageLayout>
  );
}

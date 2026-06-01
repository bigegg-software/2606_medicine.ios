import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme, logoShadow } from '@/common/theme';
import styles from '@/css/auth/welcome';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

function FeatureItem({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconBox}>
        <MaterialIcons name={icon} size={28} color={AppTheme.primaryColor} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export default function WelcomePage() {
  const navigation = useNavigation<Nav>();

  return (
    <LinearGradient
      colors={[`${AppTheme.primaryColor}1A`, AppTheme.backgroundColor, AppTheme.backgroundColor]}
      style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.logoSection}>
          <View style={[styles.logoBox, logoShadow()]}>
            <MaterialIcons name="favorite" size={56} color={AppTheme.onPrimaryColor} />
          </View>
          <Text style={styles.brand}>智荟康</Text>
          <Text style={styles.subtitle}>您的 AI 健康伴侣</Text>
        </View>

        <View style={styles.featuresRow}>
          <FeatureItem icon="favorite" label="健康管理" />
          <FeatureItem icon="shield" label="安全守护" />
          <FeatureItem icon="people" label="医护连接" />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryBtnText}>登录</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.outlineBtnText}>注册新账号</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>其他方式登录</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.wechatWrap}
            onPress={() => Alert.alert('提示', '微信登录功能开发中')}>
            <View style={styles.wechatBtn}>
              <MaterialIcons name="chat" size={28} color="#fff" />
            </View>
            <Text style={styles.wechatLabel}>微信</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          登录即表示同意<Text style={styles.link}>用户协议</Text> 和 <Text style={styles.link}>隐私政策</Text>
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

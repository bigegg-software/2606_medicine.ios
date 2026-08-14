import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/equipment/consent';

export type HrDeviceConsentModalProps = {
  visible: boolean;
  onAgree: () => void;
  onDecline: () => void;
};

/**
 * 首次连接心率监测设备说明弹窗（样式对齐 AI 数据处理授权）
 */
export default function HrDeviceConsentModal({
  visible,
  onAgree,
  onDecline,
}: HrDeviceConsentModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onDecline}
      sheetStyle={styles.sheetHost}>
      <View style={styles.wrap}>
        <Image
          style={styles.hero}
          source={require('@/assets/images/user/sq.png')}
        />
        <LinearGradient
          colors={['#E4F9D7', '#FFFFFF']}
          locations={[0, 0.5]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Image
            style={styles.topImg}
            source={require('@/assets/images/ai/topImg.png')}
          />
          <Text style={styles.title}>连接心率监测设备</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            persistentScrollbar
            indicatorStyle="black"
            bounces>
            <Text style={styles.desc}>
              为了帮助您科学追踪心率变化并优化运动效果，App 将连接您的 Polar H10
              心率胸带，并同步以下数据：
            </Text>

            <Text style={styles.sectionTitle}>收集的数据</Text>
            <Text style={styles.bullet}>
              · 实时心率（每分钟心跳次数，bpm）
            </Text>

            <Text style={styles.sectionTitle}>数据用途</Text>
            <Text style={styles.bullet}>· 同步和保存完整的心率记录</Text>
            <Text style={styles.bullet}>· 生成心率趋势分析</Text>
            <Text style={styles.bullet}>· 为 AI 健康建议提供心率数据参考</Text>

            <Text style={styles.sectionTitle}>数据共享</Text>
            <Text style={styles.bullet}>
              · 收集的数据仅用于本 App 的健康管理功能。
            </Text>
            <Text style={styles.bullet}>
              · 我们不会将您的数据出售或分享给任何第三方。
            </Text>
            <Text style={styles.bullet}>
              · 所有数据均采用加密方式进行传输和存储。
            </Text>

            <Text style={[styles.desc, { marginTop: 12 }]}>
              您可以随时在设置中断开设备连接或删除历史心率数据。
            </Text>
            <Text style={styles.desc}>
              本功能仅用于个人健康管理和运动参考，不用于医疗诊断或治疗。
            </Text>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onDecline}
              style={styles.cancelBtn}>
              <Text style={styles.cancelText}>暂不连接</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAgree}
              style={styles.confirmBtnWrap}>
              <LinearGradient
                colors={['#9BBD8E', '#6D925E']}
                locations={[0, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.confirmBtn}>
                <Text style={styles.confirmText}>同意并连接</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </BottomSheetModal>
  );
}

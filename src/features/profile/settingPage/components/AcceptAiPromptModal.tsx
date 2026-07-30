import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/profile/settings';

export type AcceptAiPromptModalProps = {
  visible: boolean;
  enabling: boolean;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AcceptAiPromptModal({
  visible,
  saving = false,
  onCancel,
  onConfirm,
}: AcceptAiPromptModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onCancel}
      dismissOnBackdropPress={!saving}
      sheetStyle={styles.acceptAiSheetHost}>
      <View style={styles.acceptAiWrap}>
        <Image
          style={styles.acceptAiHero}
          source={require('@/assets/images/user/sq.png')}
        />
        <LinearGradient
          colors={['#E4F9D7', '#FFFFFF']}
          locations={[0, 0.5]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.acceptAiSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Image style={styles.acceptAiTopImg} source={require('@/assets/images/ai/topImg.png')} />
          <Text style={styles.acceptAiTitle}>AI 数据处理授权</Text>

          <ScrollView
            style={styles.acceptAiScroll}
            contentContainerStyle={styles.acceptAiScrollContent}
            showsVerticalScrollIndicator
            persistentScrollbar
            indicatorStyle="black"
            bounces>
            <Text style={styles.acceptAiDesc}>
              为向您提供 AI 分析与个性化洞察，莱益晟 使用第三方 AI 服务提供商 Glm 和 DeepSeek。
            </Text>
            <Text style={styles.acceptAiDesc}>
              当您选择使用 AI 功能时，您提交用于分析的以下数据可能会被安全传输至上述服务商进行处理：
            </Text>

            <View style={styles.acceptAiDataList}>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_data.png')} />
                <Text style={styles.acceptText}>体征数据</Text>
              </Flex>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_cd.png')} />
                <Text style={styles.acceptText}>穿戴设备</Text>
              </Flex>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_ys.png')} />
                <Text style={styles.acceptText}>饮食记录</Text>
              </Flex>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_yd.png')} />
                <Text style={styles.acceptText}>运动记录</Text>
              </Flex>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_yy.png')} />
                <Text style={styles.acceptText}>用药记录</Text>
              </Flex>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_lt.png')} />
                <Text style={styles.acceptText}>聊天内容、问卷回答</Text>
              </Flex>
              <Flex align="center" style={styles.acceptItem}>
                <Image style={styles.acceptIcon} source={require('@/assets/images/ai/icon_qt.png')} />
                <Text style={styles.acceptText}>其他您提交用于分析的信息</Text>
              </Flex>
            </View>

            <View>
              <Text style={styles.acceptAiDesc}>这些数据 仅用于在应用内生成 AI 分析、洞察和回复。</Text>
              <Text style={styles.acceptAiDesc}>
                只有在您主动使用 AI 功能并点击 “同意” 后，相关数据才会被发送至 AI 服务提供商。
              </Text>
              <Text style={styles.acceptAiDesc}>
                AI数据处理授权后可在设置中随时撤销。撤回同意后，AI 功能将不可用。更多信息请查看
                <Text style={{ color: '#6D925E' }}>《隐私政策》</Text>。
              </Text>
            </View>
          </ScrollView>

          <View style={styles.acceptAiBtnRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={saving}
              onPress={onCancel}
              style={styles.acceptAiCancelBtn}>
              <Text style={styles.acceptAiCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={saving}
              onPress={onConfirm}
              style={[styles.acceptAiConfirmBtnWrap, saving && { opacity: 0.6 }]}>
              <LinearGradient
                colors={['#9BBD8E', '#6D925E']}
                locations={[0, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.acceptAiConfirmBtn}>
                <Text style={styles.acceptAiConfirmText}>
                  {saving ? '保存中...' : '同意'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </BottomSheetModal>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/profile/settings';

export type DeleteAccountModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const DELETE_DATA_ITEMS: ReadonlyArray<{
  title: string;
  desc: string;
  icon: ImageSourcePropType;
}> = [
  {
    title: '体征数据',
    desc: '如身高、体重、血压、心率等历史记录',
    icon: require('@/assets/images/ai/icon_data.png'),
  },
  {
    title: '穿戴设备数据',
    desc: '如智能手表/手环同步的步数、睡眠、卡路里消耗等',
    icon: require('@/assets/images/ai/icon_cd.png'),
  },
  {
    title: '饮食记录',
    desc: '每日三餐及加餐的饮食日志',
    icon: require('@/assets/images/ai/icon_ys.png'),
  },
  {
    title: '运动记录',
    desc: '运动类型、时长等历史',
    icon: require('@/assets/images/ai/icon_yd.png'),
  },
  {
    title: '用药记录',
    desc: '药品名称、剂量、服用时间等记录',
    icon: require('@/assets/images/ai/icon_yy.png'),
  },
  {
    title: '聊天内容',
    desc: '与AI管家的全部对话记录',
    icon: require('@/assets/images/ai/icon_lt.png'),
  },
  {
    title: '问卷回答',
    desc: '所有已填写的健康评估、满意度等问卷',
    icon: require('@/assets/images/ai/icon_qt.png'),
  },
  {
    title: '个人信息',
    desc: '姓名、手机号、头像、性别、年龄等个人资料',
    icon: require('@/assets/images/ai/icon_data.png'),
  },
];

export default function DeleteAccountModal({
  visible,
  onCancel,
  onConfirm,
}: DeleteAccountModalProps) {
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!visible) {
      setConfirming(false);
    }
  }, [visible]);

  const handleConfirm = useCallback(() => {
    if (confirming) return;
    setConfirming(true);
    onConfirm();
  }, [confirming, onConfirm]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onCancel}
      dismissOnBackdropPress={!confirming}>
      <View style={[styles.deleteAccountSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.deleteAccountTitle}>删除账户</Text>

        <ScrollView
          style={styles.deleteAccountScroll}
          contentContainerStyle={styles.deleteAccountScrollContent}
          showsVerticalScrollIndicator
          bounces={false}>
          <Text style={styles.deleteAccountDesc}>
            此操作将永久删除你的账户及以下所有数据，且无法撤销。
          </Text>
          <Text style={[styles.deleteAccountDesc, styles.deleteAccountSectionLabel]}>
            即将被删除的数据包括：
          </Text>
          {DELETE_DATA_ITEMS.map(item => (
            <Flex key={item.title} align="center" style={styles.deleteAccountItem}>
              <Image style={styles.deleteAccountIcon} source={item.icon} />
              <View style={styles.deleteAccountItemText}>
                <Text style={styles.deleteAccountItemTitle}>{item.title}</Text>
                <Text style={styles.deleteAccountItemDesc}>{item.desc}</Text>
              </View>
            </Flex>
          ))}
        </ScrollView>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={confirming}
          onPress={handleConfirm}
          style={[styles.deleteAccountConfirmBtn, confirming && { opacity: 0.6 }]}>
          <Text style={styles.deleteAccountConfirmText}>删除账户</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

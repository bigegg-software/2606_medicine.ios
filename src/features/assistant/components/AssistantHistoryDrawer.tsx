import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import RightDrawerModal from '@/src/components/RightDrawerModal';
import styles from '@/css/assistant/history';
import AssistantHistoryPanel from './AssistantHistoryPanel';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onStartNewChat: () => void;
};

export default function AssistantHistoryDrawer({
  visible,
  onClose,
  onSelectChat,
  onStartNewChat,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <RightDrawerModal visible={visible} onClose={onClose} drawerStyle={styles.drawerShell}>
      <View style={[styles.drawerPanel, { paddingTop: insets.top }]}>
        <Flex justify="between" align="center" style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>历史记录</Text>
          <Flex align="center">
            <TouchableOpacity
              style={styles.drawerHeaderBtn}
              onPress={() => {
                onClose();
                onStartNewChat();
              }}>
              <Image style={styles.navIcon} source={require('@/assets/images/assistant/new.png')} />
            </TouchableOpacity>
          </Flex>
        </Flex>
        <AssistantHistoryPanel
          active={visible}
          onSelectChat={chatId => {
            onClose();
            onSelectChat(chatId);
          }}
        />
      </View>
    </RightDrawerModal>
  );
}

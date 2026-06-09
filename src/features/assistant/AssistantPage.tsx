import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
  type KeyboardEvent,
} from 'react-native';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flex } from '@ant-design/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { RootState } from '@/store/store';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/assistant/assistant';
import { useAssistantChat } from './utils/useAssistantChat';
import { renderAiMessageText } from './utils/renderAiMessage';
import type { DisplayItem } from './utils/types';
import SpeechToText, { type SpeechToTextRef } from './components/SpeechToText';
import TypingDots from './components/TypingDots';

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const PANEL_HEIGHT = 220;

function getKeyboardDuration(event: KeyboardEvent) {
  if (Platform.OS === 'ios' && typeof event.duration === 'number') {
    return event.duration;
  }
  return 250;
}

function AiMessageContent({ text, streaming }: { text: string; streaming?: boolean }) {
  if (streaming && !text.trim()) {
    return <TypingDots />;
  }

  return renderAiMessageText(
    text,
    styles.aiMessageText,
    styles.aiMessageTextBold,
    styles.aiMessageTextItalic,
    styles.aiMessageTextBoldItalic,
    streaming,
  );
}

function MessageRow({
  item,
  userAvatar,
}: {
  item: DisplayItem;
  userAvatar?: string;
}) {
  if (item.type === 'time') {
    return <Text style={styles.timeText}>{item.label}</Text>;
  }

  if (item.type === 'user') {
    return (
      <Flex align="start" justify="end" style={styles.myMessageBox}>
        <View style={styles.myMessageBubbleWrap}>
          <View style={styles.myMessageBoxContent}>
            <Text style={styles.aiMessageText}>{item.text}</Text>
          </View>
          <View style={styles.myMessageBubbleArrow} />
        </View>
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        ) : (
          <Image source={require('@/assets/images/assistant/avatar.png')} style={styles.avatar} />
        )}
      </Flex>
    );
  }

  return (
    <Flex align="start" style={styles.aiMessageBox}>
      <Image source={require('@/assets/images/assistant/avatar.png')} style={styles.avatar} />
      <View style={styles.aiMessageBubbleWrap}>
        <View style={styles.aiMessageBubbleArrow} />
        <View style={styles.aiMessageBoxContent}>
          <AiMessageContent text={item.text} streaming={item.streaming} />
        </View>
      </View>
    </Flex>
  );
}

export default function AssistantPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { scaleSize } = useFontSize();
  const user = useSelector((state: RootState) => state.user.info);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const speechToTextRef = useRef<SpeechToTextRef>(null);
  const voiceBaseTextRef = useRef('');
  const keyboardHeightRef = useRef(PANEL_HEIGHT);
  const attachmentPanelOpenRef = useRef(false);
  const bottomOffset = useSharedValue(0);
  const [attachmentPanelOpen, setAttachmentPanelOpen] = useState(false);

  const getBottomInset = useCallback(
    (height: number) => Math.max(0, height - insets.bottom),
    [insets.bottom],
  );

  const {
    input,
    setInput,
    loading,
    initializing,
    displayItems,
    sendMessage,
    stopMessage,
    scrollEndRef,
  } = useAssistantChat();

  const headerTitleStyle = useMemo(
    () => ({ color: AppTheme.textPrimary, fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );

  useEffect(() => {
    scrollEndRef.current = () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    };
  }, [scrollEndRef]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [displayItems, loading, attachmentPanelOpen]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, event => {
      const adjustedHeight = getBottomInset(event.endCoordinates.height);
      keyboardHeightRef.current = adjustedHeight;
      if (attachmentPanelOpenRef.current) return;
      bottomOffset.value = withTiming(adjustedHeight, {
        duration: getKeyboardDuration(event),
        easing: Easing.out(Easing.cubic),
      });
    });

    const onHide = Keyboard.addListener(hideEvent, event => {
      if (attachmentPanelOpenRef.current) return;
      bottomOffset.value = withTiming(0, {
        duration: getKeyboardDuration(event),
        easing: Easing.out(Easing.cubic),
      });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [bottomOffset, getBottomInset]);

  const animateBottomOffset = useCallback(
    (to: number, duration = 250) => {
      bottomOffset.value = withTiming(to, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    },
    [bottomOffset],
  );

  const closeAttachmentPanel = useCallback(
    (duration = 220) => {
      attachmentPanelOpenRef.current = false;
      setAttachmentPanelOpen(false);
      animateBottomOffset(0, duration);
    },
    [animateBottomOffset],
  );

  const openAttachmentPanel = useCallback(() => {
    attachmentPanelOpenRef.current = true;
    setAttachmentPanelOpen(true);
    inputRef.current?.blur();
    Keyboard.dismiss();
    void speechToTextRef.current?.stopListening();
    animateBottomOffset(keyboardHeightRef.current || getBottomInset(PANEL_HEIGHT));
  }, [animateBottomOffset, getBottomInset]);

  const handleVoiceStart = useCallback(() => {
    setInput(current => {
      voiceBaseTextRef.current = current;
      return current;
    });
  }, [setInput]);

  const handleVoiceTextChange = useCallback((text: string) => {
    setInput(voiceBaseTextRef.current + text);
  }, [setInput]);

  const handleMicPress = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleSendPress = useCallback(() => {
    voiceBaseTextRef.current = '';
    void speechToTextRef.current?.stopListening();
    if (loading) {
      void stopMessage();
    } else {
      void sendMessage();
    }
  }, [loading, sendMessage, stopMessage]);

  const handleAddPress = useCallback(() => {
    if (attachmentPanelOpenRef.current) {
      closeAttachmentPanel();
      return;
    }
    openAttachmentPanel();
  }, [closeAttachmentPanel, openAttachmentPanel]);

  const pickDocument = useCallback(async () => {
    closeAttachmentPanel();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: DOCUMENT_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
    } catch {
      Alert.alert('错误', '选择文件失败');
    }
  }, [closeAttachmentPanel]);

  const hasInput = !!input.trim();

  const bottomAreaStyle = useAnimatedStyle(() => ({
    height: bottomOffset.value,
  }));

  const panelContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bottomOffset.value, [0, 80, PANEL_HEIGHT], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(bottomOffset.value, [0, PANEL_HEIGHT], [16, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={['#B4D0FF', '#F5F8FF']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.headerWrap}>
        <Header
          title="AI健康管家"
          headerTransparent
          headerTintColor={AppTheme.primaryColor}
          headerTitleStyle={headerTitleStyle}
          headerStyle={{ backgroundColor: 'transparent' }}
          headerShadowVisible={false}
          headerLeft={() => (
            <HeaderBackButton
              onPress={() => navigation.goBack()}
              tintColor={AppTheme.primaryColor}
            />
          )}
        />
        <View style={styles.pageLine} />
      </View>

      <View style={styles.chatBody}>
        {initializing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            {displayItems.map(item => (
              <MessageRow
                key={item.key}
                item={item}
                userAvatar={user?.avatarOssUrl}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.inputSection}>
          <View style={styles.inputBar}>
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="请输入您的问题"
                placeholderTextColor={AppTheme.textSecondary}
                multiline
                editable={!loading && !initializing}
                onFocus={() => {
                  if (attachmentPanelOpenRef.current) {
                    attachmentPanelOpenRef.current = false;
                    setAttachmentPanelOpen(false);
                  }
                  void speechToTextRef.current?.stopListening();
                }}
              />
              <SpeechToText
                ref={speechToTextRef}
                disabled={loading || initializing}
                onMicPress={handleMicPress}
                onStart={handleVoiceStart}
                onTextChange={handleVoiceTextChange}
              />
            </View>
            {loading ? (
              <TouchableOpacity
                style={[styles.sendBtn, initializing && styles.sendBtnDisabled]}
                onPress={handleSendPress}
                disabled={initializing}>
                <Text style={styles.sendBtnText}>停止</Text>
              </TouchableOpacity>
            ) : hasInput ? (
              <TouchableOpacity
                style={[styles.sendBtn, initializing && styles.sendBtnDisabled]}
                onPress={handleSendPress}
                disabled={initializing}>
                <Text style={styles.sendBtnText}>发送</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddPress}
                disabled={initializing}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Image source={require('@/assets/images/assistant/add.png')} style={styles.addIcon} />
              </TouchableOpacity>
            )}
          </View>

          <Reanimated.View style={[styles.bottomArea, bottomAreaStyle]}>
            {attachmentPanelOpen ? (
              <Reanimated.View style={[styles.uploadPanel, panelContentStyle]}>
                <Flex justify="around">
                  <TouchableOpacity
                    style={styles.uploadPanelItem}
                    onPress={() => {
                      closeAttachmentPanel();
                      navigation.navigate('CaseAlbumPage');
                    }}>
                    <Image
                      style={styles.uploadPanelImg}
                      source={require('@/assets/images/camara/type_images.png')}
                    />
                    <Text style={styles.uploadPanelTitle}>相册</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.uploadPanelItem}
                    onPress={() => {
                      closeAttachmentPanel();
                      navigation.navigate('CaseCameraPage');
                    }}>
                    <Image
                      style={styles.uploadPanelImg}
                      source={require('@/assets/images/camara/type_camara.png')}
                    />
                    <Text style={styles.uploadPanelTitle}>拍照</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadPanelItem} onPress={pickDocument}>
                    <Image
                      style={styles.uploadPanelImg}
                      source={require('@/assets/images/camara/type_documents.png')}
                    />
                    <Text style={styles.uploadPanelTitle}>文件</Text>
                  </TouchableOpacity>
                </Flex>
              </Reanimated.View>
            ) : null}
          </Reanimated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

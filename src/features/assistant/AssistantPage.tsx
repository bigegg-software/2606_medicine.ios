import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator, Keyboard, Alert, Modal, useWindowDimensions, type KeyboardEvent, } from 'react-native';
import Reanimated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import PageLayout from '@/src/components/PageLayout';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Flex, Toast } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { RootState } from '@/store/store';
import type { RootStackParamList } from '@/route/router';
import { uploadFileToAttachment } from '@/src/utils/uploadAttachment';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import styles from '@/css/assistant/assistant';
import { useAssistantChat, consumePendingAssistantNavigation } from './utils/useAssistantChat';
import { renderAiMessageText } from './utils/renderAiMessage';
import type { DisplayItem, UploadPreview } from './utils/types';
import {
  firstUploadPreviewImageSource,
  formatUploadFileSize,
  getUploadPreviewDisplayName,
  inferUploadPreviewType,
  isFileUploadType,
} from './utils/uploadPreviewHelpers';
import { openRemoteFile } from '@/src/features/profile/healthRecord/caseDetail';
import SpeechToText, { type SpeechToTextRef } from './components/SpeechToText';
import MedicationReminderCards from './components/MedicationReminderCards';
import QuestionnaireListCards from './components/QuestionnaireListCards';
import HealthStatusCards from './components/HealthStatusCards';
import TodayScheduleCards from './components/TodayScheduleCards';
import TypingDots from './components/TypingDots';
import AssistantHistoryDrawer from './components/AssistantHistoryDrawer';

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const PANEL_HEIGHT = 220;

const QUICK_ACTIONS = [
  { label: '今日安排', action: 'today_schedule' as const },
  { label: '评估量表', action: 'assessment' as const },
  { label: '健康状况', action: 'health_status' as const },
  { label: '用药提醒', action: 'reminder' as const },
];

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

  return renderAiMessageText(text, streaming);
}

function UserUploadPreview({
  uploadPreview,
  onPreviewImage,
}: {
  uploadPreview: UploadPreview;
  onPreviewImage: (files: UploadPreview['fileList']) => void;
}) {
  const firstFile = uploadPreview.fileList[0];
  const isDocumentUpload = isFileUploadType(inferUploadPreviewType(uploadPreview));
  const imageSource = firstUploadPreviewImageSource(uploadPreview);
  const fileCount = uploadPreview.fileList.length;

  const handlePress = useCallback(() => {
    if (isDocumentUpload) {
      if (!firstFile?.url) {
        Toast.fail('文件地址无效', 1.5);
        return;
      }
      const loadingKey = Toast.loading('加载中', 0);
      void openRemoteFile(firstFile.url, getUploadPreviewDisplayName(firstFile))
        .catch(() => Alert.alert('提示', '打开文件失败'))
        .finally(() => Toast.remove(loadingKey));
      return;
    }
    onPreviewImage(uploadPreview.fileList);
  }, [firstFile, isDocumentUpload, onPreviewImage, uploadPreview.fileList]);

  if (isDocumentUpload) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.myMessageBoxContent, styles.myMessageDocumentCard]}
      >
        <Flex align="center">
          <View style={styles.myMessageDocumentIconWrap}>
            <MaterialIcons name="description" size={28} color={AppTheme.textSecondary} />
          </View>
          <View style={styles.myMessageDocumentMeta}>
            <Text style={styles.myMessageDocumentName} numberOfLines={1} ellipsizeMode="tail">
              {getUploadPreviewDisplayName(firstFile)}
            </Text>
            <Text style={styles.myMessageDocumentSize}>
              {formatUploadFileSize(firstFile?.length)}
            </Text>
          </View>
        </Flex>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={styles.myMessageImageWrap}>
      {imageSource ? (
        <Image source={imageSource} style={styles.myMessageImage} resizeMode="cover" />
      ) : (
        <Flex justify="center" align="center" style={styles.myMessageImageFallback}>
          <MaterialIcons name="description" size={32} color={AppTheme.textSecondary} />
        </Flex>
      )}
      {fileCount > 1 ? (
        <View style={styles.myMessageImageCountBadge}>
          <Text style={styles.myMessageImageCountText}>+{fileCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function MessageRow({
  item,
  userAvatar,
  onPreviewImage,
}: {
  item: DisplayItem;
  userAvatar?: string;
  onPreviewImage: (files: UploadPreview['fileList']) => void;
}) {
  if (item.type === 'time') {
    return <Text style={styles.timeText}>{item.label}</Text>;
  }

  if (item.type === 'user') {
    const hasUploadFiles = !!item.uploadPreview?.fileList?.length;

    return (
      <Flex align="start" justify="end" style={styles.myMessageBox}>
        <View style={styles.myMessageBubbleWrap}>
          {hasUploadFiles ? (
            <UserUploadPreview uploadPreview={item.uploadPreview!} onPreviewImage={onPreviewImage} />
          ) : null}
          {item.text ? (
            <View style={[styles.myMessageBoxContent, hasUploadFiles ? styles.myMessageTextWithAttachment : null]}>
              <Text style={styles.aiMessageText}>{item.text}</Text>
            </View>
          ) : null}
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

  if (item.type === 'questionnaire_cards') {
    return (
      <Flex align="start" style={styles.aiMessageBoxFollowUp}>
        <View style={styles.aiMedicationCardWrap}>
          <QuestionnaireListCards items={item.items} />
          {item.suggestion ? (
            <View style={styles.medicationAdviceBox}>
              <Text style={styles.medicationAdviceTitle}>问卷建议</Text>
              <Text style={styles.medicationAdviceText}>{item.suggestion}</Text>
            </View>
          ) : null}
        </View>
      </Flex>
    );
  }

  if (item.type === 'medication_cards') {
    return (
      <Flex align="start" style={styles.aiMessageBoxFollowUp}>
        <View style={styles.aiMedicationCardWrap}>
          <MedicationReminderCards groups={item.groups} />
          {item.advice ? (
            <View style={styles.medicationAdviceBox}>
              <Text style={styles.medicationAdviceTitle}>管家建议</Text>
              <Text style={styles.medicationAdviceText}>{item.advice}</Text>
            </View>
          ) : null}
        </View>
      </Flex>
    );
  }

  if (item.type === 'health_status_cards') {
    return (
      <Flex align="start" style={styles.aiMessageBoxFollowUp}>
        <View style={styles.aiMedicationCardWrap}>
          <HealthStatusCards slides={item.slides} />
        </View>
      </Flex>
    );
  }

  if (item.type === 'today_schedule_cards') {
    return (
      <Flex align="start" style={styles.aiMessageBoxFollowUp}>
        <View style={styles.aiMedicationCardWrap}>
          <TodayScheduleCards payload={item.payload} />
        </View>
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
  const route = useRoute<RouteProp<RootStackParamList, 'AssistantPage'>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
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
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<UploadPreview['fileList']>([]);

  const handlePreviewImage = useCallback((files: UploadPreview['fileList']) => {
    if (!files.length) return;
    setPreviewImages(files);
  }, []);

  const getBottomInset = useCallback(
    (height: number) => Math.max(0, height - insets.bottom),
    [insets.bottom],
  );

  const {
    input,
    setInput,
    loading,
    actionLoading,
    initializing,
    displayItems,
    sendMessage,
    stopMessage,
    sendAttachments,
    runMedicationReminder,
    runQuestionnaireQuickAction,
    runHealthStatusQuickAction,
    runTodayScheduleQuickAction,
    startNewChat,
    openChat,
    scrollEndRef,
  } = useAssistantChat();

  const startNewChatRef = useRef(startNewChat);
  const openChatRef = useRef(openChat);
  startNewChatRef.current = startNewChat;
  openChatRef.current = openChat;

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 18 }}
            onPress={() => {
              inputRef.current?.blur();
              Keyboard.dismiss();
              void speechToTextRef.current?.stopListening();
              if (attachmentPanelOpenRef.current) {
                attachmentPanelOpenRef.current = false;
                setAttachmentPanelOpen(false);
                bottomOffset.value = withTiming(0, {
                  duration: 220,
                  easing: Easing.out(Easing.cubic),
                });
              }
              setHistoryDrawerVisible(true);
            }}>
            <Image style={styles.navIcon} source={require('@/assets/images/assistant/time.png')} />
          </TouchableOpacity>
        ),
      });

      const pending = consumePendingAssistantNavigation();
      if (pending?.startNew) {
        void startNewChatRef.current();
      } else if (pending?.chatId) {
        void openChatRef.current(pending.chatId);
      } else {
        const { chatId, startNew } = route.params ?? {};
        if (startNew) {
          navigation.setParams({ startNew: undefined });
          void startNewChatRef.current();
        } else if (chatId) {
          navigation.setParams({ chatId: undefined });
          void openChatRef.current(chatId);
        }
      }

      return () => {
        navigation.setOptions({ headerRight: undefined });
      };
    }, [bottomOffset, navigation, route.params?.chatId, route.params?.startNew]),
  );

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

      const asset = result.assets[0];
      const uploaded = await uploadFileToAttachment({
        uri: asset.uri,
        name: asset.name ?? `file_${Date.now()}`,
        type: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
        uploadType: 'file',
      });
      if (!uploaded) {
        Toast.fail('上传失败', 1.5);
        return;
      }

      const sent = await sendAttachments([uploaded], input);
      if (!sent) {
        Toast.fail('发送失败，请稍后重试', 1.5);
      }
    } catch {
      Alert.alert('错误', '选择文件失败');
    }
  }, [closeAttachmentPanel, input, sendAttachments]);

  const handleQuickActionPress = useCallback(
    (item: (typeof QUICK_ACTIONS)[number]) => {
      if ('action' in item && item.action === 'today_schedule') {
        void (async () => {
          const ok = await runTodayScheduleQuickAction();
          if (!ok) {
            Toast.fail('今日安排加载失败', 1.5);
          }
        })();
        return;
      }
      if ('action' in item && item.action === 'reminder') {
        void (async () => {
          const ok = await runMedicationReminder();
          if (!ok) {
            Toast.fail('用药提醒加载失败', 1.5);
          }
        })();
        return;
      }
      if ('action' in item && item.action === 'assessment') {
        void (async () => {
          const ok = await runQuestionnaireQuickAction();
          if (!ok) {
            Toast.fail('评估量表加载失败', 1.5);
          }
        })();
        return;
      }
      if ('action' in item && item.action === 'health_status') {
        void (async () => {
          const ok = await runHealthStatusQuickAction();
          if (!ok) {
            Toast.fail('健康状况加载失败', 1.5);
          }
        })();
        return;
      }
    },
    [runHealthStatusQuickAction, runMedicationReminder, runQuestionnaireQuickAction, runTodayScheduleQuickAction],
  );

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
    <PageLayout style={{ backgroundColor: AppTheme.backgroundColor }}>
      <KeyboardDoneAccessory />
      {/* <View style={styles.headerWrap}>
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
      </View> */}

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
                onPreviewImage={handlePreviewImage}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.inputSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionRow}
            contentContainerStyle={styles.quickActionContent}
            keyboardShouldPersistTaps="handled">
            {QUICK_ACTIONS.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickActionBtn}
                activeOpacity={0.8}
                disabled={loading || actionLoading || initializing}
                onPress={() => handleQuickActionPress(item)}>
                <Text style={styles.quickActionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
              <SpeechToText
                ref={speechToTextRef}
                disabled={loading || actionLoading || initializing}
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
      <Modal visible={previewImages.length > 0} transparent animationType="fade" onRequestClose={() => setPreviewImages([])}>
        <View style={styles.uploadPreviewModalBackdrop}>
          <TouchableOpacity style={styles.uploadPreviewModalCloseArea} activeOpacity={1} onPress={() => setPreviewImages([])} />
          <View style={styles.uploadPreviewModalContent}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={previewImages.length > 1}>
              {previewImages.map((file, index) => (
                <View key={`${file.url}-${index}`} style={[styles.uploadPreviewModalPage, { width: windowWidth }]}>
                  <Image
                    source={{ uri: file.url }}
                    style={[styles.uploadPreviewModalImage, { width: windowWidth - 32, height: windowWidth * 1.1 }]}
                    resizeMode="contain"
                  />
                  {file.originalName ? (
                    <Text style={styles.uploadPreviewModalName} numberOfLines={2}>
                      {getUploadPreviewDisplayName(file)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.uploadPreviewModalCloseBtn} onPress={() => setPreviewImages([])}>
              <Text style={styles.uploadPreviewModalCloseText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <AssistantHistoryDrawer
        visible={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
        onSelectChat={chatId => {
          void openChat(chatId);
        }}
        onStartNewChat={() => {
          void startNewChat();
        }}
      />
    </PageLayout>
  );
}

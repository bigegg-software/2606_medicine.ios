import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { sendAssistantMessage } from '@/api/assistant';
import { AppTheme } from '@/common/theme';
import styles from '@/css/assistant/assistant';
import { isApiOk } from '@/src/utils/apiHelpers';

type Msg = { id: number; role: 'ai' | 'user'; content: string; time: string };

const INITIAL: Msg[] = [
  { id: 1, role: 'ai', content: '早上好张爷爷，今天天气晴朗，气温18度，很适合出门活动。您今天有4项安排，最近的是9:30的测血糖。', time: '08:00' },
  { id: 2, role: 'user', content: '帮我看看今天要吃什么药', time: '08:05' },
  { id: 3, role: 'ai', content: '您今天需要服用的药物有：\n\n早上8点：降压药（氨氯地平 5mg）\n晚上9点：降糖药（二甲双胍 0.5g）\n\n我会在用药时间前15分钟提醒您。', time: '08:05' },
];

function nowTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [nextId, setNextId] = useState(100);
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    const userMsg: Msg = { id: nextId, role: 'user', content, time: nowTime() };
    setNextId(id => id + 1);
    setMessages(m => [...m, userMsg]);
    setText('');
    setSending(true);
    try {
      const res = await sendAssistantMessage(content);
      const reply =
        isApiOk(res as { code?: number })
          ? String((res as { data?: { reply?: string; message?: string } }).data?.reply ?? (res as { data?: string }).data ?? '已收到您的问题，我会尽快为您解答。')
          : (res as { message?: string }).message ?? '暂时无法回复，请稍后再试';
      setMessages(m => [...m, { id: nextId + 1, role: 'ai', content: reply, time: nowTime() }]);
      setNextId(id => id + 2);
    } catch {
      setMessages(m => [...m, { id: nextId + 1, role: 'ai', content: '网络异常，请检查连接后重试。', time: nowTime() }]);
      setNextId(id => id + 2);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialIcons name="smart-toy" size={28} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>AI 健康管家</Text>
          <Text style={styles.headerSub}>智荟康 · 随时为您解答</Text>
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.role === 'user' && styles.bubbleRowUser]}>
            {item.role === 'ai' ? (
              <View style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={18} color={AppTheme.primaryColor} />
              </View>
            ) : null}
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>{item.content}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="输入您的问题..."
            placeholderTextColor={AppTheme.hintTextColor}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={22} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { UserChatListItem } from '@/api/assistant';
import { deleteChat } from '@/api/assistant';
import { AppTheme } from '@/common/theme';
import NoData from '@/src/components/noData';
import SwipeDeleteRow, { closeActiveSwipeRow } from '@/src/features/profile/healthRecord/components/SwipeDeleteRow';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import styles from '@/css/assistant/history';
import {
  ASSISTANT_HISTORY_PAGE_SIZE,
  formatChatHistoryTime,
  getChatHistoryTitle,
  loadUserChatHistoryPage,
} from '../utils/assistantHistoryHelpers';

const SWIPE_STYLE_OVERRIDES = {
  swipeRow: styles.swipeRow,
  swipeAction: styles.swipeAction,
  swipeForeground: styles.swipeForeground,
  swipeDeleteBtn: styles.swipeDeleteBtn,
  editIcon: styles.swipeDeleteIcon,
};

type Props = {
  active: boolean;
  onSelectChat: (chatId: string) => void;
};

export default function AssistantHistoryPanel({ active, onSelectChat }: Props) {
  const [items, setItems] = useState<UserChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageNumRef = useRef(1);
  const hasMoreRef = useRef(true);
  const hasLoadedOnceRef = useRef(false);

  const loadPage = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    const nextPage = mode === 'more' ? pageNumRef.current + 1 : 1;

    if (mode === 'initial') {
      setLoading(true);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { rows, hasMore: nextHasMore } = await loadUserChatHistoryPage(
        nextPage,
        ASSISTANT_HISTORY_PAGE_SIZE,
      );
      setItems(prev => (mode === 'more' ? [...prev, ...rows] : rows));
      pageNumRef.current = nextPage;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
    } finally {
      hasLoadedOnceRef.current = true;
      setLoading(false);
      setLoadingMore(false);
      if (mode === 'refresh') {
        setRefreshing(false);
      }
    }
  }, []);

  const loadPageRef = useRef(loadPage);
  loadPageRef.current = loadPage;

  useEffect(() => {
    if (!active) return;
    void loadPageRef.current(hasLoadedOnceRef.current ? 'refresh' : 'initial');
  }, [active]);

  const handleRefresh = useCallback(() => {
    void loadPage('refresh');
  }, [loadPage]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (loadingMore || !hasMoreRef.current) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom < 80) {
        void loadPage('more');
      }
    },
    [loadPage, loadingMore],
  );

  const handleItemPress = useCallback(
    (item: UserChatListItem) => {
      if (item.chatId == null) return;
      onSelectChat(String(item.chatId));
    },
    [onSelectChat],
  );

  const handleDelete = useCallback((item: UserChatListItem) => {
    if (item.chatId == null) return;

    const chatId = String(item.chatId);
    Alert.alert('删除对话', '确定删除该对话记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await deleteChat(chatId);
            if (isResourceApiOk(res as { code?: number })) {
              setItems(prev => prev.filter(row => String(row.chatId) !== chatId));
              return;
            }
            const r = res as { msg?: string; message?: string };
            Alert.alert('删除失败', r.msg ?? r.message ?? '请稍后重试');
          } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
          }
        },
      },
    ]);
  }, []);

  if (loading) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.drawerList}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      onScroll={handleScroll}
      onScrollBeginDrag={closeActiveSwipeRow}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled">
      {items.length === 0 ? (
        <NoData text="暂无历史记录" />
      ) : (
        items.map(item => (
          <SwipeDeleteRow
            key={String(item.id ?? item.chatId)}
            styleOverrides={SWIPE_STYLE_OVERRIDES}
            onDelete={() => handleDelete(item)}>
            <TouchableOpacity
              style={[styles.row, styles.rowInSwipe]}
              activeOpacity={0.85}
              onPress={() => handleItemPress(item)}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {getChatHistoryTitle(item)}
              </Text>
              <Text style={styles.rowTime}>{item.createTime}</Text>
            </TouchableOpacity>
          </SwipeDeleteRow>
        ))
      )}
      {loadingMore ? (
        <View style={styles.footer}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <Text style={[styles.rowTime, { textAlign: 'center', marginTop: 8 }]}>没有更多了</Text>
      ) : null}
    </ScrollView>
  );
}

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';
import PageLayout from '@/src/components/PageLayout';
import NoData from '@/src/components/noData';
import SwipeDeleteRow, { closeActiveSwipeRow } from '@/src/features/profile/healthRecord/components/SwipeDeleteRow';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { deleteChat, getUserChatPageList, type UserChatListItem } from '@/api/assistant';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { queueAssistantNavigation } from './utils/useAssistantChat';
import styles from '@/css/assistant/history';

const PAGE_SIZE = 20;

const SWIPE_STYLE_OVERRIDES = {
  swipeRow: styles.swipeRow,
  swipeAction: styles.swipeAction,
  swipeForeground: styles.swipeForeground,
  swipeDeleteBtn: styles.swipeDeleteBtn,
  editIcon: styles.swipeDeleteIcon,
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatChatHistoryTime(createTime?: string) {
  if (!createTime) return '';
  const parsed = moment(createTime, 'YYYY-MM-DD HH:mm:ss');
  if (!parsed.isValid()) return createTime;
  const now = moment();
  if (parsed.isSame(now, 'day')) return parsed.format('HH:mm');
  if (parsed.isSame(now, 'year')) return parsed.format('MM-DD HH:mm');
  return parsed.format('YYYY-MM-DD');
}

function getChatHistoryTitle(item: UserChatListItem) {
  const title = item.question?.trim();
  return title || '新对话';
}

async function loadUserChatHistoryPage(pageNum: number, pageSize: number) {
  try {
    const res = await getUserChatPageList({ pageNum, pageSize });
    if (!isResourceApiOk(res)) {
      return { rows: [] as UserChatListItem[], hasMore: false };
    }
    const page = apiResourceData<{ total?: number; rows?: UserChatListItem[] }>(res);
    const rows = Array.isArray(page?.rows) ? page.rows : [];
    const total = page?.total ?? rows.length;
    return {
      rows,
      hasMore: pageNum * pageSize < total,
    };
  } catch {
    return { rows: [] as UserChatListItem[], hasMore: false };
  }
}

export default function AssistantHistoryPage() {
  const navigation = useNavigation<Nav>();
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
      const { rows, hasMore: nextHasMore } = await loadUserChatHistoryPage(nextPage, PAGE_SIZE);
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

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 18 }}
            onPress={() => {
              queueAssistantNavigation({ startNew: true });
              navigation.goBack();
            }}>
            <Image style={styles.navIcon} source={require('@/assets/images/assistant/new.png')} />
          </TouchableOpacity>
        ),
      });

      void loadPageRef.current(hasLoadedOnceRef.current ? 'refresh' : 'initial');

      return () => {
        navigation.setOptions({ headerRight: undefined });
      };
    }, [navigation]),
  );

  const handleRefresh = useCallback(() => {
    void loadPage('refresh');
  }, [loadPage]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (loadingMore || !hasMoreRef.current) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 80) {
      void loadPage('more');
    }
  }, [loadPage, loadingMore]);

  const handleItemPress = useCallback(
    (item: UserChatListItem) => {
      if (item.chatId == null) return;
      queueAssistantNavigation({ chatId: String(item.chatId) });
      navigation.goBack();
    },
    [navigation],
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

  return (
    <PageLayout style={styles.container}>
      {loading ? (
        <View style={styles.footer}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onScroll={handleScroll}
          onScrollBeginDrag={closeActiveSwipeRow}
          scrollEventThrottle={16}>
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
                  <Text style={styles.rowTime}>{formatChatHistoryTime(item.createTime)}</Text>
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
      )}
    </PageLayout>
  );
}

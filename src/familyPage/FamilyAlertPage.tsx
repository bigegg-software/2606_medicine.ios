import React, { useCallback, useMemo, useState } from 'react';
import {
  Text,
  Image,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  DeviceEventEmitter,
  Alert,
  RefreshControl,
} from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { Flex, Toast } from '@ant-design/react-native';
import styles from '@/css/message/index';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { RootStackParamList } from '@/route/router';
import {
  getMessageList,
  markAllMessagesRead,
  markMessageRead,
  type PatientMessageItem,
} from '@/api/message';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import {
  MESSAGE_UNREAD_CHANGED,
  shouldShowMessageDetailLink,
  type MessageListDisplayItem,
} from '@/src/features/message/utils/messageHelpers';
import {
  buildFamilyAlertScopeParams,
  buildWarningListDisplayItem,
} from './utils/familyAlertHelpers';
import {
  MESSAGE_NOT_FOUND_TOAST,
  navigateFromMessage,
} from '@/src/features/message/utils/messageNavigationHelpers';

const PAGE_SIZE = 20;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyAlertPage() {
  const navigation = useNavigation<Nav>();
  const identityPerspective = useSelector(
    (state: RootState) => state.user.systemUser?.identityPerspective,
  );
  const userId = useSelector(
    (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
  );
  const messageScope = useMemo(
    () => buildFamilyAlertScopeParams({ identityPerspective, userId }),
    [identityPerspective, userId],
  );

  const [list, setList] = useState<MessageListDisplayItem[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const hasMore = list.length < total;

  const mapRows = useCallback(
    (rows: PatientMessageItem[]) =>
      rows.map(item => buildWarningListDisplayItem(item, messageScope.identityPerspective)),
    [messageScope.identityPerspective],
  );

  const loadPage = useCallback(
    async (page: number, mode: 'initial' | 'refresh' | 'loadMore') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'loadMore') setLoadingMore(true);

      try {
        const res = await getMessageList({
          pageNum: page,
          pageSize: PAGE_SIZE,
          identityPerspective: messageScope.identityPerspective,
          userIds: messageScope.userIds,
          // isWarning: 1,
        });
        if (!isResourceApiOk(res as { code?: number })) {
          if (mode !== 'loadMore') {
            setList([]);
            setTotal(0);
            setPageNum(1);
          }
          return;
        }

        const rows = getResourceRows<PatientMessageItem>(
          res as { code?: number; rows?: PatientMessageItem[] },
        );
        const next = mapRows(rows);
        const nextTotal = Number((res as { total?: number }).total ?? next.length);

        setTotal(nextTotal);
        setPageNum(page);
        setList(prev => (mode === 'loadMore' ? [...prev, ...next] : next));
      } catch {
        if (mode !== 'loadMore') {
          setList([]);
          setTotal(0);
          setPageNum(1);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [mapRows, messageScope],
  );

  const handleReadAll = useCallback(async () => {
    if (markingAll) return;
    try {
      setMarkingAll(true);
      const res = await markAllMessagesRead(messageScope);
      if (!isResourceApiOk(res as { code?: number })) {
        const r = res as { msg?: string; message?: string };
        Alert.alert('提示', r.msg ?? r.message ?? '操作失败');
        return;
      }
      setList(prev => prev.map(item => ({ ...item, unread: false })));
      DeviceEventEmitter.emit(MESSAGE_UNREAD_CHANGED);
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, messageScope]);

  useFocusEffect(
    useCallback(() => {
      void loadPage(1, 'initial');
      return undefined;
    }, [loadPage]),
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      const renderHeaderRight = () => (
        <TouchableOpacity
          style={[styles.headerReadAll, markingAll && { opacity: 0.6 }]}
          disabled={markingAll}
          onPress={() => {
            void handleReadAll();
          }}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color="#6D925E" />
          ) : (
            <Text style={styles.headerReadAllText}>全部已读</Text>
          )}
        </TouchableOpacity>
      );

      parent?.setOptions({ headerRight: renderHeaderRight });
      return () => {
        parent?.setOptions({ headerRight: undefined });
      };
    }, [handleReadAll, markingAll, navigation]),
  );

  const handlePressItem = useCallback(
    async (item: MessageListDisplayItem) => {
      if (item.unread) {
        try {
          const res = await markMessageRead(item.id, {
            identityPerspective: messageScope.identityPerspective,
          });
          if (isResourceApiOk(res as { code?: number })) {
            setList(prev =>
              prev.map(row => (row.id === item.id ? { ...row, unread: false } : row)),
            );
            DeviceEventEmitter.emit(MESSAGE_UNREAD_CHANGED);
          }
        } catch {
          // ignore
        }
      }

      const navResult = await navigateFromMessage(
        navigation,
        {
          type: item.raw.type,
          bizId: item.raw.bizId,
          messageId: item.raw.messageId,
          createTime: item.raw.createTime,
        },
        { isElder: false },
      );
      if (navResult.action === 'missing') {
        Toast.show(navResult.toast ?? MESSAGE_NOT_FOUND_TOAST);
      }
    },
    [messageScope.identityPerspective, navigation],
  );

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    void loadPage(pageNum + 1, 'loadMore');
  }, [hasMore, loadPage, loading, loadingMore, pageNum, refreshing]);

  const renderItem = useCallback(
    ({ item }: { item: MessageListDisplayItem }) => {
      const severity = item.severity;
      const showDetail = shouldShowMessageDetailLink(item.raw.type);
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            void handlePressItem(item);
          }}
        >
          <View style={styles.messageItem}>
            <Flex justify="between" align="center">
              <Flex align="center" style={{ flexShrink: 1 }}>
                <Image style={styles.messageItemIcon} source={item.icon} />
                <Text style={styles.messageItemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {severity ? (
                  <Flex
                    style={[
                      styles.messageItemTag,
                      {
                        backgroundColor: severity.backgroundColor,
                        borderColor: severity.borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.messageItemTagText, { color: severity.color }]}>
                      {severity.label}
                    </Text>
                  </Flex>
                ) : null}
                {item.unread ? <View style={styles.readDot} /> : null}
              </Flex>
              <Text style={styles.messageItemTime}>{item.timeText}</Text>
            </Flex>
            <Text style={styles.messageItemContent}>{item.content}</Text>
            {showDetail ? (
              <>
                <View style={styles.messageItemDivider} />
                <Flex style={styles.messageItemDetail} justify="between">
                  <Text style={styles.messageItemDetailText}>查看详情</Text>
                  <Image
                    style={styles.messageItemDetailIcon}
                    source={require('@/assets/images/message/icon_right.png')}
                  />
                </Flex>
              </>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [handlePressItem],
  );

  return (
    <TabPageLayout style={styles.container}>
      {loading && list.length === 0 ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.scroll,
            list.length === 0 ? styles.emptyListContent : null,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void loadPage(1, 'refresh');
              }}
              tintColor={AppTheme.primaryColor}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>暂无预警</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={AppTheme.primaryColor} />
              </View>
            ) : null
          }
        />
      )}
    </TabPageLayout>
  );
}

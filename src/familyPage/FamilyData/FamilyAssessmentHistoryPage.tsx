import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import EmptyRecord from '@/src/components/EmptyRecord';
import type { HistoryItem } from '@/src/features/profile/questionnaire/utils/helpers';
import { loadFamilyAssessmentHistory } from './utils/familyDataAssessmentHelpers';

type Route = RouteProp<RootStackParamList, 'FamilyAssessmentHistory'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyAssessmentHistoryPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const patientUserId = String(route.params?.patientUserId ?? '').trim();

  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(
    async (isRefresh = false) => {
      if (!patientUserId) {
        setHistoryList([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const list = await loadFamilyAssessmentHistory(patientUserId);
        setHistoryList(list);
      } catch {
        setHistoryList([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientUserId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  if (loading && !refreshing) {
    return (
      <PageLayout style={styles.container}>
        <Flex justify="center" style={{ flex: 1 }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, historyList.length === 0 && styles.bodyEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadHistory(true)}
            colors={[AppTheme.primaryColor]}
            tintColor={AppTheme.primaryColor}
          />
        }
      >
        {historyList.length > 0 ? (
          historyList.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.rowBox, { backgroundColor: '#FFF' }]}
              onPress={() =>
                navigation.navigate('FamilyAssessmentResult', {
                  id: item.id,
                  patientUserId,
                })
              }
            >
              <Flex justify="between">
                <View>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  {item.date ? (
                    <Text style={[styles.rowText, { marginTop: 6 }]}>评估时间：{item.date}</Text>
                  ) : null}
                </View>
                {item.result ? (
                  <Text style={styles[item.statusStyle]}>{item.result}</Text>
                ) : null}
              </Flex>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyRecord text="暂无评估历史" />
          </View>
        )}
      </ScrollView>
    </PageLayout>
  );
}

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/nutrition/foodRecording';
import scheduleStyles from '@/css/schedule/schedule';
import DietHistoryArchiveCard from './components/DietHistoryArchiveCard';
import {
  getHistoryDietExecutionStatsParams,
  getHistoryDietNutritionParams,
  getHistoryDietPrescriptionParams,
  loadDietHistoryArchivePreview,
  type DietHistoryArchiveItem,
} from './components/utils/dietHistoryArchiveHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** 历史营养处方（个人中心「营养处方」入口） */
export default function NutritionHistoryPage() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<DietHistoryArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const list = await loadDietHistoryArchivePreview();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadHistory();
    }, [loadHistory]),
  );

  return (
    <PageLayout
      style={styles.container}
      contentStyle={{ flex: 1 }}
      showHeaderBackground={false}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[scheduleStyles.historyBox, { paddingHorizontal: 12 }]}>
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#6D925E" />
            </View>
          ) : items.length > 0 ? (
            items.map(item => (
              <DietHistoryArchiveCard
                key={item.id}
                item={item}
                onPress={() => {
                  navigation.navigate('NutritionPage', getHistoryDietNutritionParams(item.id));
                }}
                onPressPrescriptionDetail={() => {
                  navigation.navigate(
                    'NutritionPage',
                    getHistoryDietPrescriptionParams(item.id),
                  );
                }}
                onPressExecutionStats={() => {
                  navigation.navigate(
                    'NutritionExecutionStatsPage',
                    getHistoryDietExecutionStatsParams(item.id),
                  );
                }}
              />
            ))
          ) : (
            <View style={scheduleStyles.historyEmptyInline}>
              <Image
                source={require('@/assets/images/common/zwjl.png')}
                style={scheduleStyles.historyEmptyIcon}
                resizeMode="contain"
              />
              <Text style={scheduleStyles.historyEmptyText}>暂无历史营养处方</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </PageLayout>
  );
}

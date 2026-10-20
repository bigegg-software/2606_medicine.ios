import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  listCommunityScreenReport,
  type CommunityScreenReport,
} from '@/api/communityScreenReport';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/familyHistory';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import {
  formatCommunityScreenReportDate,
  resolveCommunityScreenReportIcon,
  resolveCommunityScreenReportTitle,
} from '../healthRecord/utils/communityScreenReportHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import { getCommunityScreenReportDetailRoute } from './utils/navigateHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CommunityScreeningReportHistory'>;

const PAGE_SIZE = 20;

export default function CommunityScreeningReportHistoryPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { patientUserId, viewNavParams } = resolveFamilyReadOnlyView(route.params);
  const [list, setList] = useState<CommunityScreenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const res = await listCommunityScreenReport(
        { status: 1, pageNum: 1, pageSize: PAGE_SIZE },
        patientUserId ? { patientUserId } : undefined,
      );
      if (!isResourceApiOk(res as { code?: number })) {
        setList([]);
        return;
      }
      setList(getResourceRows(res as { code?: number; rows?: CommunityScreenReport[] }));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientUserId]);

  const loadRef = useRef(load);
  loadRef.current = load;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    void loadRef.current('initial');
  }, [patientUserId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      void loadRef.current('initial');
    }, []),
  );

  return (
    <PageLayout style={styles.container} edges={[]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={list.length === 0 ? styles.bodyEmpty : styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load('refresh')}
              tintColor={AppTheme.primaryColor}
            />
          }>
          {list.length === 0 ? (
            <EmptyRecord text="暂无初筛报告" />
          ) : (
            <View style={styles.listBox}>
              {list.map((item, index) => (
                <TouchableOpacity
                  key={String(item.reportId ?? `${item.reportType}-${index}`)}
                  activeOpacity={0.85}
                  onPress={() => {
                    const target = getCommunityScreenReportDetailRoute(item.reportType);
                    navigation.navigate(target, {
                      reportId: item.reportId != null ? String(item.reportId) : undefined,
                      reportType: item.reportType,
                      ...(viewNavParams ?? {}),
                    });
                  }}>
                  <Flex align="center" style={[styles.infoBox, { backgroundColor: '#FFFFFF' }]}>
                    <View style={styles.itemImgBox}>
                      <Image
                        style={styles.itemImg}
                        source={resolveCommunityScreenReportIcon(item)}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {resolveCommunityScreenReportTitle(item)}
                      </Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {formatCommunityScreenReportDate(item)}
                      </Text>
                    </View>
                  </Flex>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </PageLayout>
  );
}

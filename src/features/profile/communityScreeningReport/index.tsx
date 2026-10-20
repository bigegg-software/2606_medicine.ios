import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/communityScreeningReport';
import type { RootStackParamList } from '@/route/router';
import { getCommunityScreenReportDetailRoute } from './utils/navigateHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityScreeningReportPage'>;

/** 兼容旧入口：按 reportType 跳转到对应详情页 */
export default function CommunityScreeningReportPage({ navigation, route }: Props) {
  useEffect(() => {
    const target = getCommunityScreenReportDetailRoute(route.params?.reportType);
    navigation.replace(target, {
      reportId: route.params?.reportId,
      reportType: route.params?.reportType,
      readOnly: route.params?.readOnly,
      patientUserId: route.params?.patientUserId,
      relationLabel: route.params?.relationLabel,
      displayName: route.params?.displayName,
    });
  }, [navigation, route.params]);

  return (
    <PageLayout style={styles.container} edges={[]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    </PageLayout>
  );
}

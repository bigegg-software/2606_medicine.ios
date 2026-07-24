import React from 'react';
import { View } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import NoData from '@/src/components/noData';
import styles from '@/css/family/home';

export default function FamilyHomePage() {
  return (
    <TabPageLayout style={styles.container}>
      <View style={styles.developingWrap}>
        <NoData text="功能开发中" />
      </View>
    </TabPageLayout>
  );
}

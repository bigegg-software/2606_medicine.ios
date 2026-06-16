import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import styles from '@/css/schedule/schedule';

export default function SchedulePage() {
  return (
    <TabPageLayout style={styles.container}>
      <Text style={styles.pageTitle}>今日安排</Text>
      <View style={styles.pageLine} />

      <ScrollView contentContainerStyle={styles.scroll} />
    </TabPageLayout>
  );
}

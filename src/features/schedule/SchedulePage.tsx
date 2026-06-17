import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Flex } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import MilestoneRings from './components/MilestoneRings';
import styles from '@/css/schedule/schedule';

export default function SchedulePage() {
  return (
    <TabPageLayout style={styles.container}>
      <Text style={styles.pageTitle}>里程碑</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.glassCardWrap}>
          <GlassView style={styles.glassCard} glassEffectStyle="regular" tintColor="#F8FAFF">
            <View style={styles.glassCardHighlight} pointerEvents="none" />
            <Flex justify="between" align="center">
              <Text style={styles.glassCardTitle}>防跌倒运动处方</Text>
              <Flex style={styles.statusBox}>
                <Text style={styles.statusText}>状态良好</Text>
              </Flex>
            </Flex>
            <Flex style={{ marginTop: 16 }}>
              <MilestoneRings />
            </Flex>
          </GlassView>
        </View>
      </ScrollView>
    </TabPageLayout>
  );
}

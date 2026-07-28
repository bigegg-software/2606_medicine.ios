import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/feedback/index';
import type { PointsRuleTableSection } from '../utils/pointsRulesHelpers';

type Props = {
  loading: boolean;
  sections: PointsRuleTableSection[];
};

export default function PointsRulesTable({ loading, sections }: Props) {
  if (loading) {
    return (
      <View style={styles.pointsLoading}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  if (sections.length === 0) {
    return <Text style={styles.faqAnswer}>暂无可用的积分规则</Text>;
  }

  return (
    <View style={styles.pointsWrap}>
      {sections.map(section => (
        <View key={section.key} style={styles.pointsSection}>
          <Text style={styles.pointsSectionTitle}>{section.title}</Text>
          <View style={styles.pointsTable}>
            <View style={[styles.pointsRow, styles.pointsHeaderRow]}>
              <Text style={[styles.pointsCell, styles.pointsName, styles.pointsHeaderText]}>项目</Text>
              <Text style={[styles.pointsCell, styles.pointsValue, styles.pointsHeaderText]}>积分</Text>
              <Text style={[styles.pointsCell, styles.pointsLimit, styles.pointsHeaderText]}>上限</Text>
            </View>
            {section.rows.map(row => (
              <View key={row.key} style={styles.pointsRow}>
                <Text style={[styles.pointsCell, styles.pointsName]} numberOfLines={2}>
                  {row.name}
                </Text>
                <Text style={[styles.pointsCell, styles.pointsValue, styles.pointsReward]}>
                  {row.points}
                </Text>
                <Text style={[styles.pointsCell, styles.pointsLimit]} numberOfLines={2}>
                  {row.limit === '0' ? '--' : row.limit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

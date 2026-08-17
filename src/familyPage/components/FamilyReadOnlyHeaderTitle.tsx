import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import FamilyRelationHeaderBadge from './FamilyRelationHeaderBadge';

type Props = {
  title: string;
  relationLabel: string;
};

/** 导航栏标题 + 家人切换标签 */
export default function FamilyReadOnlyHeaderTitle({ title, relationLabel }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <FamilyRelationHeaderBadge label={relationLabel} style={styles.badge} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flexShrink: 1,
  },
  badge: {
    marginLeft: 8,
    marginRight: 0,
  },
});

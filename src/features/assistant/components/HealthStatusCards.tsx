import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/assistant/assistant';
import type { RootStackParamList } from '@/route/router';
import type { HealthStatusCardItem } from '../utils/healthStatusAction';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  cards: HealthStatusCardItem[];
};

function HealthStatusCard({
  item,
  onPress,
  showDivider,
}: {
  item: HealthStatusCardItem;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      {showDivider ? <View style={styles.healthStatusDivider} /> : null}
      <TouchableOpacity style={styles.healthStatusCol} activeOpacity={0.85} onPress={onPress}>
        <Text style={styles.healthStatusLabel}>{item.label}</Text>
        <Text style={styles.healthStatusValue} numberOfLines={1}>
          {item.value}
        </Text>
        <Text style={styles.healthStatusUnit}>{item.unit}</Text>
        {item.status ? (
          <Text style={[styles.healthStatusStatus, { color: item.statusColor }]} numberOfLines={1}>
            {item.status}
          </Text>
        ) : null}
      </TouchableOpacity>
    </>
  );
}

export default function HealthStatusCards({ cards }: Props) {
  const navigation = useNavigation<Nav>();

  if (!cards.length) {
    return null;
  }

  const openVitals = () => {
    navigation.navigate('VitalsPage');
  };

  return (
    <View style={styles.healthStatusBox}>
      <View style={styles.healthStatusRow}>
        {cards.map((item, index) => (
          <HealthStatusCard
            key={item.key}
            item={item}
            showDivider={index > 0}
            onPress={openVitals}
          />
        ))}
      </View>
    </View>
  );
}

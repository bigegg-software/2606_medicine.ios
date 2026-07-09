import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/vitals/bloodPage';
import {
  BMI_CATEGORY_COLORS,
  getBmiCategory,
  getBmiMarkerPercent,
  type BmiCategory,
} from '../helpers/weight';

const BMI_LABELS: BmiCategory[] = ['偏瘦', '正常', '超重', '肥胖'];

type Props = {
  bmi?: number | null;
};

export default function BmiProgressBar({ bmi }: Props) {
  const hasBmi = bmi != null && bmi > 0;
  const category = hasBmi ? getBmiCategory(bmi) : null;
  const markerPercent = hasBmi ? getBmiMarkerPercent(bmi) : 0;
  const markerColor = category ? BMI_CATEGORY_COLORS[category] : '#999999';

  const markerLeft = useMemo(() => {
    const clamped = Math.max(4, Math.min(96, markerPercent));
    return `${clamped}%`;
  }, [markerPercent]);

  return (
    <View style={styles.bmiProgressWrap}>
      <View style={styles.bmiProgressTrack}>
        {hasBmi ? (
          <View
            pointerEvents="none"
            style={[
              styles.bmiProgressMarkerWrap,
              { left: markerLeft, marginLeft: -7 },
            ]}
          >
            <Text style={[styles.bmiProgressMarkerText, { color: markerColor }]}>
              {bmi!.toFixed(1)}
            </Text>
            <View style={[styles.bmiProgressMarker, { borderTopColor: markerColor }]} />
          </View>
        ) : null}

        <View style={styles.bmiProgressBar}>
          {BMI_LABELS.map(label => (
            <View
              key={label}
              style={[
                styles.bmiProgressSegment,
                { backgroundColor: BMI_CATEGORY_COLORS[label] },
              ]}
            />
          ))}
        </View>
      </View>

      <Flex justify="between" style={styles.bmiProgressLabels}>
        {BMI_LABELS.map(label => {
          const active = category === label;
          return (
            <Text
              key={label}
              style={[
                styles.bmiProgressLabel,
                active && { color: BMI_CATEGORY_COLORS[label], fontWeight: 'bold' },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </Flex>
    </View>
  );
}

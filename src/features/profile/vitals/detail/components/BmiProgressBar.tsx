import React, { useMemo } from 'react';
import { View, Image, Text } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/vitals/bloodPage';
import {
  BMI_CATEGORY_COLORS,
  getBmiCategory,
  getBmiMarkerPercent,
  type BmiCategory,
} from '../helpers/weight';

const BMI_LABELS: BmiCategory[] = ['偏瘦', '正常', '超重', '肥胖'];

const BMI_RANGE_LABELS: Record<BmiCategory, string> = {
  偏瘦: '小于18.4',
  正常: '18.5-23.9',
  超重: '24.0-27.9',
  肥胖: '大于等于28.0',
};

type Props = {
  bmi?: number | null;
};

export default function BmiProgressBar({ bmi }: Props) {
  const hasBmi = bmi != null && bmi > 0;
  const category = hasBmi ? getBmiCategory(bmi) : null;
  const markerPercent = hasBmi ? getBmiMarkerPercent(bmi) : 0;

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
              { left: markerLeft, marginLeft: -6 },
            ]}
          >
            <Image
              style={styles.bmiProgressMarkerIcon}
              source={require('@/assets/images/vitals/icon_sj.png')}
            />
          </View>
        ) : null}

        <View style={styles.bmiProgressBar}>
          {BMI_LABELS.map((label, index) => (
            <View
              key={label}
              style={[
                styles.bmiProgressSegment,
                index === 0 && styles.bmiProgressSegmentFirst,
                index === BMI_LABELS.length - 1 && styles.bmiProgressSegmentLast,
                { backgroundColor: BMI_CATEGORY_COLORS[label] },
              ]}
            />
          ))}
        </View>
      </View>

      <Flex justify="between" style={styles.bmiProgressLabels}>
        {BMI_LABELS.map(label => (
          <View key={label} style={styles.bmiProgressLabelItem}>
            <Text style={styles.bmiProgressLabel}>{label}</Text>
            <Text style={styles.bmiProgressRangeLabel}>{BMI_RANGE_LABELS[label]}</Text>
          </View>
        ))}
      </Flex>
    </View>
  );
}

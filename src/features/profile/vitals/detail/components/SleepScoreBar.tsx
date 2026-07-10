import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import styles from '@/css/vitals/bloodPage';

const SCORE_DIVIDER_RATIOS = [0.55, 0.65, 0.75, 0.85];
const TRACK_HEIGHT = 12;
const MARKER_SIZE = 34;
const MARKER_OFFSET = MARKER_SIZE / 2;
const MARKER_TOP = (TRACK_HEIGHT - MARKER_SIZE) / 2;
const MARKER_EDGE_PERCENT = 8;

type Props = {
  score?: number | null;
};

export default function SleepScoreBar({ score }: Props) {
  const markerPercent = useMemo(() => {
    if (score == null) return null;
    return Math.max(
      MARKER_EDGE_PERCENT,
      Math.min(100 - MARKER_EDGE_PERCENT, score),
    );
  }, [score]);

  return (
    <View
      style={[
        styles.sleepScoreBarWrap,
        { paddingVertical: Math.ceil((MARKER_SIZE - TRACK_HEIGHT) / 2) },
      ]}
    >
      <View style={styles.sleepScoreBarTrack}>
        {SCORE_DIVIDER_RATIOS.map(ratio => (
          <View
            key={ratio}
            pointerEvents="none"
            style={[
              styles.sleepScoreBarDivider,
              { left: `${ratio * 100}%`, marginLeft: -0.5 },
            ]}
          />
        ))}

        {markerPercent != null ? (
          <Image
            source={require('@/assets/images/vitals/sleep_score_marker.png')}
            style={[
              styles.sleepScoreBarMarker,
              {
                left: `${markerPercent}%`,
                top: MARKER_TOP,
                marginLeft: -MARKER_OFFSET,
                width: MARKER_SIZE,
                height: MARKER_SIZE,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import styles from '@/css/schedule/schedule';

const CANVAS_SIZE = 120;
const CENTER = CANVAS_SIZE / 2;
const RING_STROKE_WIDTH = 10;

type RingConfig = {
  size: number;
  strokeWidth: number;
  trackColor: string;
  gradientColors: [string, string];
  gradientAngle: number;
  gradientId: string;
};

const RING_CONFIGS: RingConfig[] = [
  {
    size: 120,
    strokeWidth: RING_STROKE_WIDTH,
    trackColor: '#6D925E',
    gradientColors: ['#6D925E', '#6D925E'],
    gradientAngle: 90,
    gradientId: 'milestoneRing0',
  },
  {
    size: 91,
    strokeWidth: RING_STROKE_WIDTH,
    trackColor: '#72A1C5',
    gradientColors: ['#72A1C5', '#72A1C5'],
    gradientAngle: 90,
    gradientId: 'milestoneRing1',
  },
  {
    size: 62,
    strokeWidth: RING_STROKE_WIDTH,
    trackColor: '#FB4550',
    gradientColors: ['#FB4550', '#FB4550'],
    gradientAngle: 157,
    gradientId: 'milestoneRing2',
  },
  {
    size: 32,
    strokeWidth: RING_STROKE_WIDTH,
    trackColor: '#EE9C44',
    gradientColors: ['#EE9C44', '#EE9C44'],
    gradientAngle: 305,
    gradientId: 'milestoneRing3',
  },
];

function cssAngleToGradientPoints(angleDeg: number, cx: number, cy: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x1: cx - Math.cos(rad) * radius,
    y1: cy - Math.sin(rad) * radius,
    x2: cx + Math.cos(rad) * radius,
    y2: cy + Math.sin(rad) * radius,
  };
}

function getProgressDotPosition(cx: number, cy: number, radius: number, progress: number) {
  const angleDeg = -90 + progress * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

type Props = {
  /** 四条环的进度，0–1 */
  progress?: [number, number, number, number];
};

export default function MilestoneRings({
  progress = [0.75, 0.62, 0.48, 0.35],
}: Props) {
  return (
    <View style={styles.milestoneRingsBox}>
      <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
        <Defs>
          {RING_CONFIGS.map(ring => {
            const radius = (ring.size - ring.strokeWidth) / 2;
            const grad = cssAngleToGradientPoints(ring.gradientAngle, CENTER, CENTER, radius);
            return (
              <LinearGradient
                key={ring.gradientId}
                id={ring.gradientId}
                x1={grad.x1}
                y1={grad.y1}
                x2={grad.x2}
                y2={grad.y2}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={ring.gradientColors[0]} />
                <Stop offset="1" stopColor={ring.gradientColors[1]} />
              </LinearGradient>
            );
          })}
        </Defs>

        {RING_CONFIGS.map((ring, index) => {
          const radius = (ring.size - ring.strokeWidth) / 2;
          const clampedProgress = Math.min(1, Math.max(0, progress[index] ?? 0));
          const circumference = 2 * Math.PI * radius;
          const dashLength = circumference * clampedProgress;
          const gapLength = circumference - dashLength;
          const dot =
            clampedProgress > 0
              ? getProgressDotPosition(CENTER, CENTER, radius, clampedProgress)
              : null;

          return (
            <React.Fragment key={ring.gradientId}>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={radius}
                stroke={ring.trackColor}
                strokeOpacity={0.14}
                strokeWidth={ring.strokeWidth}
                fill="none"
              />
              {clampedProgress > 0 ? (
                <>
                  <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={radius}
                    stroke={`url(#${ring.gradientId})`}
                    strokeWidth={ring.strokeWidth}
                    fill="none"
                    strokeDasharray={`${dashLength} ${gapLength}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                  />
                  {dot ? <Circle cx={dot.x} cy={dot.y} r={3} fill="#FFFFFF" /> : null}
                </>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

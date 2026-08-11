import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import Svg, { Line } from 'react-native-svg';
import styles from '@/css/schedule/testingPage';

type Props = {
  steps: readonly string[];
  /** 是否显示步骤间虚线连接，默认 true */
  showConnector?: boolean;
};

export default function StepTimeline({ steps, showConnector = true }: Props) {
  const containerRef = useRef<View>(null);
  const firstRef = useRef<View>(null);
  const lastRef = useRef<View>(null);
  const [dashLine, setDashLine] = useState<{ left: number; top: number; height: number } | null>(null);
  const lastIndex = steps.length - 1;

  const syncLine = () => {
    if (!showConnector) {
      setDashLine(null);
      return;
    }
    const container = containerRef.current;
    const first = firstRef.current;
    const last = lastRef.current;
    if (!container || !first || !last || lastIndex < 1) {
      setDashLine(null);
      return;
    }
    first.measureLayout(
      container,
      (_, y1, __, h1) => {
        last.measureLayout(
          container,
          (x2, y2, w2, h2) => {
            const top = y1 + h1 / 2;
            const height = y2 + h2 / 2 - top;
            setDashLine(
              height > 0 ? { left: x2 + w2 / 2 - 0.5, top, height } : null,
            );
          },
          () => {},
        );
      },
      () => {},
    );
  };

  return (
    <View ref={containerRef} style={styles.infoItem}>
      {showConnector && dashLine ? (
        <View style={[styles.infoStepDashLine, dashLine]} pointerEvents="none">
          <Svg width={1} height={dashLine.height}>
            <Line
              x1={0.5}
              y1={0}
              x2={0.5}
              y2={dashLine.height}
              stroke="#6D925E"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </Svg>
        </View>
      ) : null}
      {steps.map((step, index) => (
        <Flex
          key={index}
          align="start"
          style={index > 0 ? styles.infoStepRowGap : null}>
          <View style={styles.infoStepLineCol}>
            <View
              ref={el => {
                if (!showConnector) return;
                if (index === 0) firstRef.current = el;
                if (index === lastIndex) lastRef.current = el;
              }}
              style={styles.infoItemNumBox}
              onLayout={
                showConnector && (index === 0 || index === lastIndex)
                  ? syncLine
                  : undefined
              }>
              <Text style={styles.infoItemNum}>{index + 1}</Text>
            </View>
          </View>
          <Text style={styles.infoStepText}>{step}</Text>
        </Flex>
      ))}
    </View>
  );
}

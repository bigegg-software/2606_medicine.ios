import React, { useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle, StyleSheet } from 'react-native';
import { Canvas, DashPathEffect, RoundedRect } from '@shopify/react-native-skia';
import { Flex } from '@ant-design/react-native';
type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  strokeWidth?: number;
  borderColor?: string;
  dashLength?: number;
  dashGap?: number;
};

export default function DashedBorderBox({
  children,
  style,
  borderRadius = 8,
  strokeWidth = 1,
  borderColor = 'rgba(5,58,147,0.42)',
  dashLength = 10,
  dashGap = 10,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const inset = strokeWidth / 2;

  return (
    <Flex direction='column' justify='center' align='center' style={style} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <RoundedRect
            x={inset}
            y={inset}
            width={size.width - strokeWidth}
            height={size.height - strokeWidth}
            r={borderRadius}
            color={borderColor}
            style="stroke"
            strokeWidth={strokeWidth}>
            <DashPathEffect intervals={[dashLength, dashGap]} />
          </RoundedRect>
        </Canvas>
      ) : null}
      {children}
    </Flex>
  );
}

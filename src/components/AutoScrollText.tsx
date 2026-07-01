import React, { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type AutoScrollTextProps = {
  children: string;
  textStyle?: StyleProp<TextStyle>;
  scrollStyle?: StyleProp<ViewStyle>;
};

export default function AutoScrollText({ children, textStyle, scrollStyle }: AutoScrollTextProps) {
  const scrollRef = useRef<ScrollView>(null);
  const containerWidthRef = useRef(0);
  const contentWidthRef = useRef(0);
  const scrollXRef = useRef(0);
  const directionRef = useRef(1);
  const pauseUntilRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const stopScroll = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const startScroll = useCallback(() => {
    stopScroll();
    scrollXRef.current = 0;
    directionRef.current = 1;
    pauseUntilRef.current = Date.now() + 1200;
    scrollRef.current?.scrollTo({ x: 0, animated: false });

    const tick = () => {
      const maxScroll = contentWidthRef.current - containerWidthRef.current;
      if (maxScroll <= 1) {
        frameRef.current = null;
        return;
      }

      const now = Date.now();
      if (now >= pauseUntilRef.current) {
        scrollXRef.current += directionRef.current * 0.5;

        if (scrollXRef.current >= maxScroll) {
          scrollXRef.current = maxScroll;
          directionRef.current = -1;
          pauseUntilRef.current = now + 1200;
        } else if (scrollXRef.current <= 0) {
          scrollXRef.current = 0;
          directionRef.current = 1;
          pauseUntilRef.current = now + 1200;
        }

        scrollRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [stopScroll]);

  const updateScroll = useCallback(() => {
    const maxScroll = contentWidthRef.current - containerWidthRef.current;
    if (maxScroll > 1) {
      startScroll();
    } else {
      stopScroll();
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [startScroll, stopScroll]);

  useEffect(() => {
    updateScroll();
    return stopScroll;
  }, [children, updateScroll, stopScroll]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      nestedScrollEnabled
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={scrollStyle}
      onLayout={event => {
        containerWidthRef.current = event.nativeEvent.layout.width;
        updateScroll();
      }}
      onContentSizeChange={width => {
        contentWidthRef.current = width;
        updateScroll();
      }}>
      <Text style={[textStyle, { flexShrink: 0 }]} numberOfLines={1}>
        {children}
      </Text>
    </ScrollView>
  );
}

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import styles from '@/css/assistant/assistant';

const ACTIVE_SEQUENCE = [1, 2, 0];

export default function TypingDots() {
  const [activeIndex, setActiveIndex] = useState(ACTIVE_SEQUENCE[0]);

  useEffect(() => {
    let frame = 0;
    const timer = setInterval(() => {
      frame = (frame + 1) % ACTIVE_SEQUENCE.length;
      setActiveIndex(ACTIVE_SEQUENCE[frame]);
    }, 400);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.typingDots}>
      {[0, 1, 2].map(index => (
        <View
          key={index}
          style={[
            styles.typingDot,
            index === activeIndex ? styles.typingDotActive : styles.typingDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, type LayoutChangeEvent, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/exercise';

const BANNER_ASPECT = 351 / 104;

const COOLDOWN_EXERCISES: ReadonlyArray<{
  key: string;
  title: string;
  duration: string;
  thumb: ImageSourcePropType;
}> = [
  {
    key: 'ydkz',
    title: '慢走恢复',
    duration: '12分钟',
    thumb: require('@/assets/images/exercise/ydkz.png'),
  },
  {
    key: 'gtt',
    title: '深呼吸放松',
    duration: '12分钟',
    thumb: require('@/assets/images/exercise/gtt.png'),
  },
  {
    key: 'sbhr',
    title: '全身静态拉伸',
    duration: '12分钟',
    thumb: require('@/assets/images/exercise/sbhr.png'),
  },
];

export default function CooldownPhase() {
  const [bannerWidth, setBannerWidth] = useState(0);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COOLDOWN_EXERCISES.map(item => [item.key, true])),
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== bannerWidth) {
      setBannerWidth(nextWidth);
    }
  };

  const toggleSelected = (key: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.trainingPhaseContent} onLayout={handleLayout}>
      {bannerWidth > 0 ? (
        <View
          style={[
            styles.trainingPhaseBannerWrap,
            {
              width: bannerWidth,
              height: bannerWidth / BANNER_ASPECT,
            },
          ]}>
          <Image
            style={[
              styles.trainingPhaseBanner,
              {
                width: bannerWidth,
                height: bannerWidth / BANNER_ASPECT,
              },
            ]}
            source={require('@/assets/images/exercise/ls.png')}
            resizeMode="cover"
          />
          <View style={styles.trainingPhaseBannerBox}>
            <Text style={styles.trainingPhaseBannerTitle}>冷身放松·5–10 分钟</Text>
            <Text style={styles.trainingPhaseBannerValue}>
              低强度活动 + 静态拉伸，帮助心率平稳回落、促进恢复。
            </Text>
          </View>
        </View>
      ) : null}

      {COOLDOWN_EXERCISES.map(item => {
        const selected = selectedMap[item.key] !== false;
        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.85}
            onPress={() => toggleSelected(item.key)}>
            <Flex align="center" style={styles.trainingExerciseCard}>
              <Image style={styles.trainingExerciseThumb} source={item.thumb} />
              <View style={styles.trainingExerciseInfo}>
                <Text style={styles.trainingExerciseTitle}>{item.title}</Text>
                <Text style={styles.trainingExerciseDuration}>{item.duration}</Text>
              </View>
              <Image
                style={styles.trainingExerciseCheck}
                source={
                  selected
                    ? require('@/assets/images/login/icon_select.png')
                    : require('@/assets/images/login/icon_unselected.png')
                }
              />
            </Flex>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

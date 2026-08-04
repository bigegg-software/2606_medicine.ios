import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, type LayoutChangeEvent } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/exercise';

const BANNER_ASPECT = 351 / 104;

export default function WarmupPhase() {
  const [bannerWidth, setBannerWidth] = useState(0);
  const [selected, setSelected] = useState(true);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== bannerWidth) {
      setBannerWidth(nextWidth);
    }
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
            source={require('@/assets/images/exercise/rs.png')}
            resizeMode="cover"
          />
          <View style={styles.trainingPhaseBannerBox}>
            <Text style={styles.trainingPhaseBannerTitle}>热身·5–10 分钟</Text>
            <Text style={styles.trainingPhaseBannerValue}>
              低强度有氧 + 动态拉伸，唤醒身体、升高体温、降低受伤风险。
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelected(prev => !prev)}>
        <Flex align="center" style={styles.trainingExerciseCard}>
          <Image
            style={styles.trainingExerciseThumb}
            source={require('@/assets/images/exercise/ydkz.png')}
          />
          <View style={styles.trainingExerciseInfo}>
            <Text style={styles.trainingExerciseTitle}>原地快走</Text>
            <Text style={styles.trainingExerciseDuration}>12分钟</Text>
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelected(prev => !prev)}>
        <Flex align="center" style={styles.trainingExerciseCard}>
          <Image
            style={styles.trainingExerciseThumb}
            source={require('@/assets/images/exercise/gtt.png')}
          />
          <View style={styles.trainingExerciseInfo}>
            <Text style={styles.trainingExerciseTitle}>动态高抬腿</Text>
            <Text style={styles.trainingExerciseDuration}>12分钟</Text>
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelected(prev => !prev)}>
        <Flex align="center" style={styles.trainingExerciseCard}>
          <Image
            style={styles.trainingExerciseThumb}
            source={require('@/assets/images/exercise/sbhr.png')}
          />
          <View style={styles.trainingExerciseInfo}>
            <Text style={styles.trainingExerciseTitle}>手臂绕环</Text>
            <Text style={styles.trainingExerciseDuration}>12分钟</Text>
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelected(prev => !prev)}>
        <Flex align="center" style={styles.trainingExerciseCard}>
          <Image
            style={styles.trainingExerciseThumb}
            source={require('@/assets/images/exercise/dtls.png')}
          />
          <View style={styles.trainingExerciseInfo}>
            <Text style={styles.trainingExerciseTitle}>髋关节动态拉伸</Text>
            <Text style={styles.trainingExerciseDuration}>12分钟</Text>
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

    </View>
  );
}

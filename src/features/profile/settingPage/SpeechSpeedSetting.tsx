import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/profile/settings';
import SpeechSpeedStepSlider from './components/SpeechSpeedStepSlider';

export default function SpeechSpeedSettingPage() {
  const [speechRate, setSpeechRate] = useState(1.0);

  const handleSave = useCallback(() => {
    // TODO: 保存语音语速
  }, [speechRate]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <View style={{ flex: 1 }}>
        <View style={[styles.scroll, { flex: 1 }]}>
          <View style={[styles.sectionBox, styles.speechSpeedSectionBox]}>
            <Text style={styles.speechSpeedTitle}>拖动滑块调节</Text>
            <SpeechSpeedStepSlider value={speechRate} onChange={setSpeechRate} />
          </View>
        </View>

        <View style={styles.fontSizeBottomBar}>
          <TouchableOpacity
            style={styles.fontSizeConfirmBtn}
            activeOpacity={0.7}
            onPress={handleSave}
          >
            <Flex style={{ flex: 1 }} justify="center" align="center">
              <Text style={styles.fontSizeConfirmText}>保存</Text>
            </Flex>
          </TouchableOpacity>
        </View>
      </View>
    </PageLayout>
  );
}

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/profile/settings';
import {
  SPEECH_SPEED_OPTIONS,
  type SpeechSpeed,
} from './utils/settingsHelpers';

export default function SpeechSpeedSettingPage() {
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>('normal');

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>语音语速</Text>
        <View style={styles.sectionBox}>
          <Flex justify="between">
            {SPEECH_SPEED_OPTIONS.map(item => {
              const active = speechSpeed === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.optionBox, active && styles.optionBoxActive]}
                  onPress={() => setSpeechSpeed(item.key)}>
                  <Flex style={{ flex: 1 }} justify="center">
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                  </Flex>
                </TouchableOpacity>
              );
            })}
          </Flex>
        </View>
      </ScrollView>
    </PageLayout>
  );
}

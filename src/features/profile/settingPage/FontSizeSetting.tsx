import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { FONT_SIZE_OPTIONS } from '@/common/fontSize';
import { useFontSize } from '@/common/FontSizeContext';
import styles from '@/css/profile/settings';

export default function FontSizeSettingPage() {
  const { option, setOption } = useFontSize();

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>字体大小</Text>
        <View style={styles.sectionBox}>
          <Flex justify="between">
            {FONT_SIZE_OPTIONS.map(item => {
              const active = option === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.optionBox, active && styles.optionBoxActive]}
                  onPress={() => {
                    void setOption(item.key);
                  }}>
                  <Flex style={{ flex: 1 }} justify="center">
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                  </Flex>
                </TouchableOpacity>
              );
            })}
          </Flex>
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>预览效果：</Text>
            <Text style={[styles.previewText, { fontSize: 16, lineHeight: 24 }]}>
              这是一段文字示例，用于展示当前字体大小的效果。
            </Text>
          </View>
        </View>
      </ScrollView>
    </PageLayout>
  );
}

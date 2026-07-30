import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import PageLayout from '@/src/components/PageLayout';
import { useFontSize } from '@/common/FontSizeContext';
import styles from '@/css/profile/settings';
import FontSizeStepSlider from './components/FontSizeStepSlider';

export default function FontSizeSettingPage() {
  const navigation = useNavigation();
  const { option, setOption, scaleSize } = useFontSize();
  const previewFontSize = scaleSize(16);
  const previewLineHeight = Math.round(previewFontSize * 1.5);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <View style={{ flex: 1 }}>
        <View style={[styles.scroll, styles.fontPreviewChatArea]}>
          <View style={styles.fontPreviewChat}>
            <View style={styles.fontPreviewRightWrap}>
              <View style={styles.fontPreviewRightBubble}>
                <Text style={[styles.fontPreviewRightText, { fontSize: previewFontSize }]}>
                  预览字体大小
                </Text>
              </View>
            </View>
            <View style={styles.fontPreviewLeftWrap}>
              <View style={styles.fontPreviewLeftBubble}>
                <Text
                  style={[
                    styles.fontPreviewLeftText,
                    { fontSize: previewFontSize, lineHeight: previewLineHeight },
                  ]}
                >
                  拖动下面滑块，可设置字体大小。设置后，会改变对话中的字体大小，如果在使用过程中存在问题或意见，可反馈给莱益晟团队。
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.fontSizeSliderSection}>
          <FontSizeStepSlider
            value={option}
            onChange={next => {
              void setOption(next);
            }}
          />
        </View>

        <View style={styles.fontSizeBottomBar}>
          <TouchableOpacity
            style={styles.fontSizeConfirmBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Flex style={{ flex: 1 }} justify="center" align="center">
              <Text style={styles.fontSizeConfirmText}>确定</Text>
            </Flex>
          </TouchableOpacity>
        </View>
      </View>
    </PageLayout>
  );
}

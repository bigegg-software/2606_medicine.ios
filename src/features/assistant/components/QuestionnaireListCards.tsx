import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { QuestionnaireType } from '@/api/questionTemplate';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/assistant/assistant';
import {
  checkQuestionnaireStartAvailability,
  QUESTIONNAIRE_ASSISTANT_ICONS,
  type AssistantQuestionnaireItem,
} from '../utils/questionnaireQuickAction';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  items: AssistantQuestionnaireItem[];
};

export default function QuestionnaireListCards({ items }: Props) {
  const navigation = useNavigation<Nav>();
  const [checkingType, setCheckingType] = useState<QuestionnaireType | null>(null);

  const handleStartPress = useCallback(
    async (item: AssistantQuestionnaireItem) => {
      if (checkingType != null) return;

      setCheckingType(item.type);
      const loadingKey = Toast.loading('校验中', 0);
      try {
        const result = await checkQuestionnaireStartAvailability(item.type);
        if (result.canStart) {
          navigation.navigate('QuestionnairePage', { type: item.type });
          return;
        }
        const tip = result.nextAssessmentDate
          ? `下次可评估时间：${result.nextAssessmentDate}`
          : '当前暂不可评估';
        Toast.info(tip, 2);
      } catch (error) {
        console.error('checkQuestionnaireStartAvailability failed:', error);
        Toast.fail('评估状态校验失败', 1.5);
      } finally {
        Toast.remove(loadingKey);
        setCheckingType(null);
      }
    },
    [checkingType, navigation],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.questionnaireReminderBox}>
      {items.map((item, index) => (
        <Flex
          align="center"
          key={String(item.type)}
          style={[styles.questionnaireReminder, index > 0 && styles.questionnaireReminderRow]}>
          <Image
            source={QUESTIONNAIRE_ASSISTANT_ICONS[item.iconIndex] ?? QUESTIONNAIRE_ASSISTANT_ICONS[0]}
            style={styles.questionnaireReminderIcon}
          />
          <View style={styles.questionnaireReminderTitleCol}>
            <Text style={styles.questionnaireReminderTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.canStart && item.nextAssessmentDate ? (
              <Text style={styles.questionnaireNextAssessmentText}>
                下次评估：{item.nextAssessmentDate}
              </Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.questionnaireReminderDuration}>约{item.duration}</Text>
            <TouchableOpacity
              style={[
                styles.questionnaireStartBtn,
                { marginTop: 6 },
                !item.canStart && styles.questionnaireStartBtnDisabled,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                void handleStartPress(item);
              }}>
              <Text
                style={[
                  styles.questionnaireStartBtnText,
                  !item.canStart && styles.questionnaireStartBtnTextDisabled,
                ]}>
                开始评估
              </Text>
            </TouchableOpacity>
          </View>
        </Flex>
      ))}
    </View>
  );
}

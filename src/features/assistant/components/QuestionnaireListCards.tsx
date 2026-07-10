import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { QuestionnaireType } from '@/api/questionTemplate';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/assistant/assistant';
import {
  QUESTIONNAIRE_ASSISTANT_ICONS,
  type AssistantQuestionnaireItem,
} from '../utils/questionnaireQuickAction';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  items: AssistantQuestionnaireItem[];
};

export default function QuestionnaireListCards({ items }: Props) {
  const navigation = useNavigation<Nav>();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.questionnaireReminderBox}>
      {items.map((item, index) => (
        <Flex align="center" key={String(item.type)} style={[styles.questionnaireReminder, index > 0 && styles.questionnaireReminderRow]}>
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
              style={[styles.questionnaireStartBtn, { marginTop: 6 }, !item.canStart && styles.questionnaireStartBtnDisabled]}
              disabled={!item.canStart}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('QuestionnairePage', { type: item.type as QuestionnaireType })}>
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

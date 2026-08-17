import { View, Text } from 'react-native';
import { Flex } from '@ant-design/react-native';
import type {
  QuestionnaireType,
  UserQuestionAnswerItem,
} from '@/api/questionTemplate';
import styles from '@/css/family/assessmentResult';
import {
  formatHeightWeightDisplay,
  isOptionSelected,
  sortOptions,
} from '@/src/features/profile/questionnaire/utils/helpers';

function formatEq5dSelfHealthAnswer(answer: string) {
  const score = Number(answer.trim());
  if (!Number.isFinite(score)) return answer || null;
  return `${Math.round(score)}分`;
}

function renderSelectedAnswerBox(text: string, key: string) {
  if (!text.trim()) return null;
  return (
    <View key={key} style={styles.answerSelectedBox}>
      <Text style={styles.answerSelectedText}>{text}</Text>
    </View>
  );
}

/** 渲染家人评估详情中的单题作答块（仅展示选中项） */
export function renderFamilyAssessmentQuestionBlock(
  item: UserQuestionAnswerItem,
  index: number,
  questionnaireType?: QuestionnaireType,
) {
  const question = item.questions?.[0];
  const questionType = question?.type;
  const answer = item.answers?.[0]?.answer ?? '';
  const options = sortOptions(item.options);
  const questionTitle = question?.question?.trim() || `问题${index + 1}`;
  const titleText = `${index + 1}.${questionTitle}`;

  let selectedTexts: string[] = [];

  if (questionType === 3 || options.length === 0) {
    const eq5dSelfHealthDisplay =
      questionnaireType === 3 && questionType === 3
        ? formatEq5dSelfHealthAnswer(answer)
        : null;
    const heightWeightDisplay =
      questionType === 3 && !eq5dSelfHealthDisplay
        ? formatHeightWeightDisplay(answer)
        : null;

    if (eq5dSelfHealthDisplay) {
      selectedTexts = [`自我健康评分: ${eq5dSelfHealthDisplay}`];
    } else if (heightWeightDisplay) {
      selectedTexts = [
        `身高: ${heightWeightDisplay.heightText}`,
        `体重: ${heightWeightDisplay.weightText}`,
        `BMI: ${heightWeightDisplay.bmiText}`,
      ];
    } else if (answer) {
      selectedTexts = [answer];
    }
  } else {
    selectedTexts = options
      .map((option, optionIndex) =>
        isOptionSelected(optionIndex, answer, questionType) ? (option.desc ?? '') : '',
      )
      .filter(Boolean);
  }

  return (
    <View key={`${item.templateId ?? index}`} style={styles.answerQuestion}>
      <Flex align="start">
        <View style={styles.answerQuestionBar} />
        <Text style={styles.answerQuestionTitle}>{titleText}</Text>
      </Flex>
      {selectedTexts.map((text, textIndex) =>
        renderSelectedAnswerBox(text, `${item.templateId ?? index}-ans-${textIndex}`),
      )}
    </View>
  );
}

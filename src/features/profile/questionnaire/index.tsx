import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, } from 'react-native';
import { Flex, DatePicker, Toast } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import {
    addUserQuestion,
    getQuestionTemplateList,
    type AddUserQuestionResult,
    type QuestionnaireType,
    type QuestionOptionItem,
    type QuestionTemplate,
    type QuestionTemplateListResult,
    type UserQuestionAnswerItem,
    type UserQuestionRecord,
} from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

function getTemplateKey(template: QuestionTemplate) {
    return template.templateId ?? template.id ?? 0;
}

function sortOptions(options: QuestionOptionItem[] = []) {
    return [...options].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function getQuestionTypeLabel(type?: number) {
    switch (type) {
        case 0:
            return '单选题';
        case 1:
            return '选择时长';
        case 2:
            return '选择时间';
        case 3:
            return '填空题';
        case 4:
            return '多选题';
        default:
            return '';
    }
}

function formatTimeAnswer(date: Date) {
    return moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
}

function parseHeightWeightAnswer(answer: string) {
    const [height = '', weight = ''] = answer.split(',');
    return { height, weight };
}

function formatHeightWeightAnswer(height: string, weight: string) {
    return `${height},${weight}`;
}

function normalizeHeightWeightAnswer(answer: string) {
    const { height, weight } = parseHeightWeightAnswer(answer);
    return `${height.trim()},${weight.trim()}`;
}

function calculateBmi(heightCm: number, weightKg: number) {
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

function calculateScore(templates: QuestionTemplate[], answers: Record<number, string>) {
    return templates.reduce((total, template) => {
        const key = getTemplateKey(template);
        const answer = answers[key];
        if (!answer) return total;
        const questionType = template.questionOption?.questions?.[0]?.type;
        if (questionType === 3) return total;
        const options = sortOptions(template.questionOption?.options);
        const indices =
            questionType === 4
                ? answer.split(',').map(item => Number(item)).filter(item => !Number.isNaN(item))
                : [Number(answer)].filter(item => !Number.isNaN(item));
        return total + indices.reduce((sum, index) => sum + (options[index]?.score ?? 0), 0);
    }, 0);
}

function buildQuestionsAnswer(
    templates: QuestionTemplate[],
    answers: Record<number, string>,
): UserQuestionAnswerItem[] {
    return templates.map(template => {
        const key = getTemplateKey(template);
        const questionType = template.questionOption?.questions?.[0]?.type;
        const rawAnswer = answers[key] ?? '';
        const answer = questionType === 3 ? normalizeHeightWeightAnswer(rawAnswer) : rawAnswer;
        return {
            templateId: key,
            answers: [{ answer }],
            options: sortOptions(template.questionOption?.options),
            questions: template.questionOption?.questions ?? [],
        };
    });
}

export default function QuestionnairePage({ route }: { route: { params: { type: QuestionnaireType } } }) {
    const { type } = route.params;
    const navigation: any = useNavigation();
    const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = (await getQuestionTemplateList(type)) as unknown as QuestionTemplateListResult;
            const list = (apiResourceData<QuestionTemplate[]>(res) ?? [])
                .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
            setTemplates(list);
            setCurrentIndex(0);
            setAnswers({});
        } catch {
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, [type]);

    useFocusEffect(
        useCallback(() => {
            loadTemplates();
        }, [loadTemplates]),
    );

    const currentTemplate = templates[currentIndex];
    const currentQuestion = currentTemplate?.questionOption?.questions?.[0];
    const currentOptions = useMemo(
        () => sortOptions(currentTemplate?.questionOption?.options),
        [currentTemplate],
    );
    const total = templates.length;
    const isLast = currentIndex >= total - 1;
    const templateKey = currentTemplate ? getTemplateKey(currentTemplate) : 0;
    const currentAnswer = answers[templateKey] ?? '';
    const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

    const hasCurrentAnswer = useMemo(() => {
        if (!currentQuestion) return false;
        if (currentQuestion.type === 3) {
            const { height, weight } = parseHeightWeightAnswer(currentAnswer);
            return Number(height) > 0 && Number(weight) > 0;
        }
        if (currentQuestion.type === 4) {
            return currentAnswer.split(',').filter(Boolean).length > 0;
        }
        return Boolean(currentAnswer.trim());
    }, [currentAnswer, currentQuestion]);

    const setSingleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [templateKey]: value }));
    };

    const toggleMultiAnswer = (index: number) => {
        const selected = currentAnswer ? currentAnswer.split(',').filter(Boolean) : [];
        const value = String(index);
        const next = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value].sort((a, b) => Number(a) - Number(b));
        setSingleAnswer(next.join(','));
    };

    const handleNext = async () => {
        if (!hasCurrentAnswer) {
            Alert.alert('提示', '请先完成当前题目');
            return;
        }
        if (!isLast) {
            setCurrentIndex(prev => prev + 1);
            return;
        }

        setSubmitting(true);
        const loadingKey = Toast.loading('提交中', 0);
        try {
            const questionsAnswer = buildQuestionsAnswer(templates, answers);
            const res = (await addUserQuestion({
                type,
                questionsAnswer,
                comments: '',
                score: calculateScore(templates, answers),
            })) as unknown as AddUserQuestionResult;
            if (!isResourceApiOk(res)) {
                Alert.alert('提交失败', res?.msg || '请稍后重试');
                return;
            }
            const data = apiResourceData<UserQuestionRecord>(res);
            Toast.show('提交成功');
            navigation.replace('QuestionnaireResult', {
                id: String(data?.id ?? ''),
                type,
            });
        } catch {
            Alert.alert('提交失败', '请稍后重试');
        } finally {
            Toast.remove(loadingKey);
            setSubmitting(false);
        }
    };

    const renderOptions = () => {
        if (!currentQuestion) return null;

        if (currentQuestion.type === 3) {
            const { height, weight } = parseHeightWeightAnswer(currentAnswer);
            const heightNum = Number(height);
            const weightNum = Number(weight);
            const bmi =
                heightNum > 0 && weightNum > 0 ? calculateBmi(heightNum, weightNum) : null;
            return (
                <>
                    <View style={styles.fillBox}>
                        <Text style={styles.fillLabel}>身高（cm）</Text>
                        <TextInput
                            style={styles.fillInput}
                            value={height}
                            onChangeText={value =>
                                setSingleAnswer(formatHeightWeightAnswer(value.replace(/[^\d.]/g, ''), weight))
                            }
                            placeholder="请输入身高"
                            placeholderTextColor={AppTheme.textSecondary}
                            keyboardType="decimal-pad"
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    <View style={styles.fillBox}>
                        <Text style={styles.fillLabel}>体重（kg）</Text>
                        <TextInput
                            style={styles.fillInput}
                            value={weight}
                            onChangeText={value =>
                                setSingleAnswer(formatHeightWeightAnswer(height, value.replace(/[^\d.]/g, '')))
                            }
                            placeholder="请输入体重"
                            placeholderTextColor={AppTheme.textSecondary}
                            keyboardType="decimal-pad"
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    {bmi != null && Number.isFinite(bmi) ? (
                        <Text style={styles.bmiText}>BMI：{bmi.toFixed(1)}</Text>
                    ) : (
                        <Text style={styles.bmiPlaceholder}>填写身高和体重后自动计算 BMI</Text>
                    )}
                </>
            );
        }

        if (currentQuestion.type === 2) {
            const dateValue = currentAnswer ? moment(currentAnswer).toDate() : new Date();
            return (
                <DatePicker precision="minute" value={dateValue} onOk={date => setSingleAnswer(formatTimeAnswer(date))}>
                    <TouchableOpacity activeOpacity={0.7} style={styles.mapItem}>
                        <Text style={styles.mapItemText}>
                            {currentAnswer ? moment(currentAnswer).format('YYYY年M月D日 HH:mm') : '请选择时间'}
                        </Text>
                    </TouchableOpacity>
                </DatePicker>
            );
        }

        if (currentQuestion.type === 4) {
            const selected = currentAnswer ? currentAnswer.split(',').filter(Boolean) : [];
            return currentOptions.map((option, index) => {
                const active = selected.includes(String(index));
                return (
                    <TouchableOpacity
                        key={`${templateKey}-${index}`}
                        activeOpacity={0.7}
                        style={[styles.mapItem, active && styles.mapItemActive]}
                        onPress={() => toggleMultiAnswer(index)}>
                        <Text style={styles.mapItemText}>{option.desc ?? ''}</Text>
                    </TouchableOpacity>
                );
            });
        }

        return currentOptions.map((option, index) => {
            const active = currentAnswer === String(index);
            return (
                <TouchableOpacity
                    key={`${templateKey}-${index}`}
                    activeOpacity={0.7}
                    style={[styles.mapItem, active && styles.mapItemActive]}
                    onPress={() => setSingleAnswer(String(index))}>
                    <Text style={styles.mapItemText}>{option.desc ?? ''}</Text>
                </TouchableOpacity>
            );
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </SafeAreaView>
        );
    }

    if (!currentTemplate || !currentQuestion) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <Text style={styles.rowText}>暂无问卷题目</Text>
                </Flex>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Flex style={styles.titleBox}>
                    <Text style={styles.leftTitle}>测评进度</Text>
                    <Flex style={styles.progressBarBox}>
                        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                    </Flex>
                    <Text style={styles.leftTitle}>
                        {currentIndex + 1}/{total}
                    </Text>
                </Flex>

                <Flex align="center" style={styles.questionBox}>
                    <Image source={require('@/assets/images/questionnaire/question.png')} style={styles.questionImg} />
                    <View style={styles.questionBubbleWrap}>
                        <View style={styles.questionBubbleArrow} />
                        <View style={styles.questionBubble}>
                            <Text style={styles.questionText}>{currentQuestion.question ?? ''}</Text>
                        </View>
                    </View>
                </Flex>

                <Text style={styles.questionTitle}>{getQuestionTypeLabel(currentQuestion.type)}</Text>
                {renderOptions()}
            </ScrollView>
            <TouchableOpacity
                style={[styles.nextBtn, (!hasCurrentAnswer || submitting) && styles.nextBtnDisabled]}
                disabled={!hasCurrentAnswer || submitting}
                onPress={handleNext}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text style={styles.nextBtnText}>{isLast ? '提交' : '下一题'}</Text>
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

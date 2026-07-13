import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, } from 'react-native';
import { Flex, DatePicker, Toast } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import type { RootStackParamList } from '@/route/router';
import QuestionnairePercentRulerSlider from './components/QuestionnairePercentRulerSlider';
import { isPercentRulerQuestion } from './utils/helpers';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QuestionnairePage'>;

function getTemplateKey(template: QuestionTemplate) {
    return template.templateId ?? template.id ?? 0;
}

function sortOptions(options: QuestionOptionItem[] = []) {
    return [...options].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
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

function calculateScore(
    questionnaireType: QuestionnaireType,
    templates: QuestionTemplate[],
    answers: Record<number, string>,
) {
    return templates.reduce((total, template) => {
        const key = getTemplateKey(template);
        const answer = answers[key];
        if (!answer) return total;
        const questionType = template.questionOption?.questions?.[0]?.type;
        if (questionType === 3) {
            if (questionnaireType === 3) {
                const num = Number(answer);
                if (!Number.isFinite(num)) return total;
                return num > 1 ? num / 100 : num;
            }
            return total;
        }
        const options = sortOptions(template.questionOption?.options);
        const indices =
            questionType === 4
                ? answer.split(',').map(item => Number(item)).filter(item => !Number.isNaN(item))
                : [Number(answer)].filter(item => !Number.isNaN(item));
        return total + indices.reduce((sum, index) => sum + (options[index]?.score ?? 0), 0);
    }, 0);
}

function buildQuestionsAnswer(
    questionnaireType: QuestionnaireType,
    templates: QuestionTemplate[],
    answers: Record<number, string>,
): UserQuestionAnswerItem[] {
    return templates.map(template => {
        const key = getTemplateKey(template);
        const questionType = template.questionOption?.questions?.[0]?.type;
        const rawAnswer = answers[key] ?? '';
        const answer = questionType === 3 && questionnaireType !== 3
            ? normalizeHeightWeightAnswer(rawAnswer)
            : rawAnswer.trim();
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
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const allowExitRef = useRef(false);
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
                .filter(item => item.delFlag !== '1')
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
            allowExitRef.current = false;
            loadTemplates();
        }, [loadTemplates]),
    );

    useEffect(() => {
        navigation.setOptions({ gestureEnabled: false });
    }, [navigation]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', event => {
            if (allowExitRef.current) {
                return;
            }

            event.preventDefault();
            Alert.alert('提示', '您确定要放弃填写问卷吗？', [
                { text: '继续', style: 'cancel' },
                {
                    text: '放弃',
                    style: 'destructive',
                    onPress: () => {
                        allowExitRef.current = true;
                        navigation.dispatch(event.data.action);
                    },
                },
            ]);
        });

        return unsubscribe;
    }, [navigation]);

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

    const isPercentRuler = isPercentRulerQuestion(templateKey, currentQuestion?.type);

    const hasCurrentAnswer = useMemo(() => {
        if (!currentQuestion) return false;
        if (currentQuestion.type === 3) {
            if (type === 3) {
                if (isPercentRuler) {
                    const num = Number(currentAnswer);
                    return Number.isFinite(num) && num >= 1 && num <= 100;
                }
                return Boolean(currentAnswer.trim());
            }
            const { height, weight } = parseHeightWeightAnswer(currentAnswer);
            return Number(height) > 0 && Number(weight) > 0;
        }
        if (currentQuestion.type === 4) {
            return currentAnswer.split(',').filter(Boolean).length > 0;
        }
        return Boolean(currentAnswer.trim());
    }, [currentAnswer, currentQuestion, isPercentRuler, type]);

    const setSingleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [templateKey]: value }));
    };

    useEffect(() => {
        if (!isPercentRuler || currentAnswer) return;
        setSingleAnswer('50');
    }, [templateKey, isPercentRuler, currentAnswer]);

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
            const questionsAnswer = buildQuestionsAnswer(type, templates, answers);
            const res = (await addUserQuestion({
                type,
                questionsAnswer,
                comments: '',
                score: calculateScore(type, templates, answers),
            })) as unknown as AddUserQuestionResult;
            if (!isResourceApiOk(res)) {
                Alert.alert('提交失败', res?.msg || '请稍后重试');
                return;
            }
            const data = apiResourceData<UserQuestionRecord>(res);
            Toast.show('提交成功');
            allowExitRef.current = true;
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

    useEffect(() => {
        navigation.setOptions({
            title: type === 0 ? '跌倒风险评估问卷' : type === 1 ? '日常生活能力评估' : type === 2 ? '营养风险评估' : "评估问卷",
        });
    }, []);

    const renderOptions = () => {
        if (!currentQuestion) return null;

        if (currentQuestion.type === 3) {
            if (type === 3) {
                if (isPercentRulerQuestion(templateKey, currentQuestion.type)) {
                    const initialValue = currentAnswer ? Number(currentAnswer) : 50;
                    return (
                        <QuestionnairePercentRulerSlider
                            key={templateKey}
                            initialValue={Number.isFinite(initialValue) ? initialValue : 50}
                            onValueChange={value => setSingleAnswer(String(Math.round(value)))}
                        />
                    );
                }
                return (
                    <View style={styles.fillBox}>
                        <TextInput
                            style={styles.fillInput}
                            value={currentAnswer}
                            onChangeText={setSingleAnswer}
                            placeholder="请输入"
                            placeholderTextColor={AppTheme.textSecondary}
                            keyboardType="number-pad"
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                );
            }

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
                        <Text style={[styles.mapItemText, active && styles.mapItemTextActive]}>
                            {option.desc ?? ''}
                        </Text>
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
                    <Text style={[styles.mapItemText, active && styles.mapItemTextActive]}>
                        {option.desc ?? ''}
                    </Text>
                </TouchableOpacity>
            );
        });
    };

    if (loading) {
        return (
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </PageLayout>
        );
    }

    if (!currentTemplate || !currentQuestion) {
        return (
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <Text style={styles.rowText}>暂无问卷题目</Text>
                </Flex>
            </PageLayout>
        );
    }


    return (
        <PageLayout style={styles.container} edges={[]}>
            <KeyboardDoneAccessory />
            <View style={styles.pageContent}>
                <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                    <Flex style={styles.titleBox}>
                        <Flex style={styles.progressBarBox}>
                            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                        </Flex>
                    </Flex>


                    <View style={styles.questionBox}>
                        <LinearGradient
                            colors={['#F4F6F0', '#FFFFFF', '#FFFFFF']}
                            locations={[0, 0.4955, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.questionBoxGradient}
                        >
                            <View style={styles.questionHeader}>
                                <Flex justify='between'>
                                    <Text style={styles.questionBubbleLeftTitle}>测评进度</Text>
                                    <Text style={styles.leftTitle}>
                                        <Text style={styles.leftTitleNumber}>{currentIndex + 1}</Text>/{total}
                                    </Text>
                                </Flex>
                                <Text style={styles.questionBubbleLeftText}>请根据你的实际情况选择对应答案</Text>
                            </View>
                            <View style={styles.lineBox}></View>

                            <Flex align="start" style={styles.questionBubble}>
                                <View style={styles.questionBubbleIcon}></View>
                                <Text style={styles.questionText}>{currentQuestion.question ?? ''}</Text>
                            </Flex>

                            {renderOptions()}
                        </LinearGradient>
                    </View>
                </ScrollView>
                <Flex
                    justify="between"
                    style={[
                        styles.bottomBar,
                        { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.bottomBarButtonLeft,
                            { flex: 1 },
                            (!hasCurrentAnswer || submitting) && { opacity: 0.5 },
                        ]}
                        disabled={!hasCurrentAnswer || submitting}
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Text style={styles.bottomBarButtonTextLeft}>{isLast ? '提交' : '下一题'}</Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </View>
        </PageLayout>
    );
}

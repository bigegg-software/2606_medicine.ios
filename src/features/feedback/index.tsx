import React, { useCallback, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    findNodeHandle,
    type FocusEvent,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/feedback/index';
import { submitUserFeedback } from '@/api/userFeedback';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { FEEDBACK_FAQ_LIST } from './utils/feedbackHelpers';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';

const FEEDBACK_KEYBOARD_ACCESSORY_ID = 'feedbackContentDoneToolbar';

export default function FeedbackPage() {
    const scrollRef = useRef<ScrollView>(null);
    const [expandedId, setExpandedId] = useState<string | null>(FEEDBACK_FAQ_LIST[0]?.id ?? null);
    const [feedbackContent, setFeedbackContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const toggleFaq = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const canSubmit = feedbackContent.trim().length > 0;

    const scrollFocusedInputIntoView = useCallback((e: FocusEvent) => {
        const targetHandle = findNodeHandle(e.target as unknown as number | React.Component);
        if (targetHandle == null) return;

        setTimeout(() => {
            const scrollView = scrollRef.current as ScrollView & {
                getScrollResponder?: () => {
                    scrollResponderScrollNativeHandleToKeyboard?: (
                        nodeHandle: number,
                        additionalOffset: number,
                        preventNegativeScrollOffset?: boolean,
                    ) => void;
                };
            } | null;
            const responder = scrollView?.getScrollResponder?.();
            if (responder?.scrollResponderScrollNativeHandleToKeyboard) {
                responder.scrollResponderScrollNativeHandleToKeyboard(targetHandle, 100, true);
                return;
            }
            scrollRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 80 : 120);
    }, []);

    const handleSubmit = async () => {
        if (!feedbackContent.trim()) {
            Alert.alert('提示', '请输入反馈内容');
            return;
        }

        try {
            setSubmitting(true);
            const res = await submitUserFeedback({ content: feedbackContent.trim() });
            if (isResourceApiOk(res as { code?: number })) {
                Alert.alert('提示', '反馈已提交');
                setFeedbackContent('');
                return;
            }
            const r = res as { msg?: string; message?: string };
            Alert.alert('提交失败', r.msg ?? r.message ?? '请稍后重试');
        } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageLayout style={styles.container} edges={[]}>
            <KeyboardDoneAccessory nativeID={FEEDBACK_KEYBOARD_ACCESSORY_ID} />
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}>
                <Flex justify="between" align="center" style={styles.topBox}>
                    <View style={styles.topLeft}>
                        <Image style={styles.feedbackTitle} source={require('@/assets/images/feedback/icon_bz.png')} />
                        <Text style={styles.feedbackDesc}>我们会认真对待您的每一条反馈！</Text>
                    </View>
                    <Image style={styles.feedbackImg} source={require('@/assets/images/feedback/feedback.png')} />
                </Flex>

                <View style={[styles.infoBox, { paddingBottom: 0 }]}>
                    <Text style={styles.infoTitle}>常见问题</Text>
                    {FEEDBACK_FAQ_LIST.map((item, index) => {
                        const expanded = expandedId === item.id;
                        const isLast = index === FEEDBACK_FAQ_LIST.length - 1;
                        return (
                            <View key={item.id} style={[styles.faqItem, isLast && styles.faqItemLast]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => toggleFaq(item.id)}
                                    style={styles.faqHeader}>
                                    <Flex justify="between" align="center" style={{ flex: 1 }}>
                                        <Text style={styles.faqTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Image
                                            style={styles.faqIcon}
                                            source={
                                                expanded
                                                    ? require('@/assets/images/feedback/icon_sq.png')
                                                    : require('@/assets/images/feedback/icon_zk.png')
                                            }
                                        />
                                    </Flex>
                                </TouchableOpacity>
                                {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
                            </View>
                        );
                    })}
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>意见反馈</Text>
                    <TextInput
                        style={styles.feedbackTextarea}
                        placeholder="请输入您的意见或建议"
                        placeholderTextColor="#999999"
                        value={feedbackContent}
                        onChangeText={setFeedbackContent}
                        onFocus={scrollFocusedInputIntoView}
                        multiline
                        textAlignVertical="top"
                        inputAccessoryViewID={FEEDBACK_KEYBOARD_ACCESSORY_ID}
                    />
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.bottomBarButton, (!canSubmit || submitting) && { opacity: 0.6 }]}
                    activeOpacity={0.7}
                    disabled={!canSubmit || submitting}
                    onPress={handleSubmit}>
                    <Flex style={{ flex: 1 }}>
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.bottomBarButtonText}>提交</Text>
                        )}
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}

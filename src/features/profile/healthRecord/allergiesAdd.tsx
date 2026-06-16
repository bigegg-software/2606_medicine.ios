import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAllergyInfo, updateAllergy, type AllergyItem } from '@/api/allergy';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergies';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AllergiesAdd'>;

const SEVERITY_OPTIONS = ['轻度', '中度', '严重'] as const;
const ALLERGEN_NAME_MAX_LENGTH = 50;

function limitText(value: string, maxLength: number) {
    return value.slice(0, maxLength);
}

function getAllergenPlaceholder(allergyType: string) {
    switch (allergyType) {
        case '药物过敏':
            return '如：青霉素、头孢类、阿司匹林';
        case '食物过敏':
            return '如：海鲜、花生、牛奶、鸡蛋';
        case '其他':
            return '如：花粉、尘螨、动物毛发、乳胶';
        default:
            return '请输入过敏原名称';
    }
}

function normalizeSeverity(value?: string) {
    if ((SEVERITY_OPTIONS as readonly string[]).includes(value ?? '')) {
        return value!;
    }
    return SEVERITY_OPTIONS[0];
}

export default function AllergiesAddPage({ route }: Props) {
    const { type, editIndex } = route.params;
    const isEdit = editIndex != null;
    const navigation = useNavigation<Nav>();
    const [allergenName, setAllergenName] = useState('');
    const [severity, setSeverity] = useState<string>(SEVERITY_OPTIONS[0]);
    const [allergicSymptoms, setAllergicSymptoms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [initializing, setInitializing] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) {
            navigation.setOptions({ title: `添加${type}` });
            return;
        }
        navigation.setOptions({ title: `编辑${type}` });
        (async () => {
            try {
                const res = await getAllergyInfo();
                const data = apiResourceData<{ allergyList?: AllergyItem[] }>(
                    res as { code?: number; data?: { allergyList?: AllergyItem[] } },
                );
                const item = data?.allergyList?.[editIndex!];
                if (!item) {
                    return;
                }
                setAllergenName(limitText(item.allergenName ?? '', ALLERGEN_NAME_MAX_LENGTH));
                setSeverity(normalizeSeverity(item.severity));
                setAllergicSymptoms(item.allergicSymptoms ?? '');
            } catch {
                Alert.alert('错误', '加载记录失败');
            } finally {
                setInitializing(false);
            }
        })();
    }, [editIndex, isEdit, navigation, type]);

    const submit = async () => {
        if (!allergenName.trim()) {
            Alert.alert('提示', '请输入过敏原名称');
            return;
        }

        setSubmitting(true);
        try {
            const res = await getAllergyInfo();
            const data = apiResourceData<{ allergyList?: AllergyItem[] }>(
                res as { code?: number; data?: { allergyList?: AllergyItem[] } },
            );
            const current = Array.isArray(data?.allergyList) ? [...data!.allergyList!] : [];

            const item: AllergyItem = {
                allergyType: type,
                allergenName: allergenName.trim(),
                severity,
                allergicSymptoms: allergicSymptoms.trim() || undefined,
            };

            if (isEdit) {
                current[editIndex!] = item;
            } else {
                current.push(item);
            }

            const updateRes = await updateAllergy({ allergyList: current });
            if (isResourceApiOk(updateRes as { code?: number })) {
                navigation.goBack();
                return;
            }
            const r = updateRes as { msg?: string; message?: string };
            Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
        } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (initializing) {
        return (
            <PageLayout style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>过敏原名称</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder={getAllergenPlaceholder(type)}
                            placeholderTextColor={AppTheme.textSecondary}
                            value={allergenName}
                            onChangeText={value => setAllergenName(limitText(value, ALLERGEN_NAME_MAX_LENGTH))}
                            maxLength={ALLERGEN_NAME_MAX_LENGTH}
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>严重程度</Text>
                        <Flex justify="between">
                            {SEVERITY_OPTIONS.map(item => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.yzBox, severity === item && styles.yzBoxActive]}
                                    onPress={() => setSeverity(item)}>
                                    <Flex style={{ flex: 1 }}>
                                        <Text style={[styles.yzText, severity === item && styles.yzTextActive]}>{item}</Text>
                                    </Flex>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>

                    <View>
                        <Text style={styles.rowTitle}>过敏症状</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="如：皮疹、呼吸困难、皮肤瘙痒"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={allergicSymptoms}
                            onChangeText={setAllergicSymptoms}
                            multiline
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    <View style={styles.rowLine} />
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.addText}>{isEdit ? '保存修改' : '确认添加'}</Text>
                    )}
                </Flex>
            </TouchableOpacity>
        </PageLayout>
    );
}

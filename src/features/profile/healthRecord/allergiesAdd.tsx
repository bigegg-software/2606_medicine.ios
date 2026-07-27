import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAllergyInfo, updateAllergy, type AllergyItem } from '@/api/allergy';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergiesAdd';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import {
    ALLERGEN_NAME_MAX_LENGTH,
    SEVERITY_OPTIONS,
    getAllergenPlaceholder,
    limitText,
    normalizeSeverity,
} from './utils/allergiesHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AllergiesAdd'>;

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
                <View style={styles.center}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
            <KeyboardDoneAccessory />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    contentContainerStyle={styles.body}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag">
                    <View style={styles.rowBox}>
                        <Flex align="center" style={styles.tipHeader}>
                            <Image
                                style={styles.tipIcon}
                                source={require('@/assets/images/case/icon_zd.png')}
                            />
                            <Text style={styles.tipTitle}>完善您的健康信息</Text>
                        </Flex>

                        <Flex justify="between" align="center" style={styles.formRow}>
                            <Text style={styles.formRowLabel} numberOfLines={1}>
                                过敏原名称
                            </Text>
                            <TextInput
                                style={styles.formRowInput}
                                placeholder={getAllergenPlaceholder(type)}
                                placeholderTextColor="#999999"
                                value={allergenName}
                                onChangeText={value => setAllergenName(limitText(value, ALLERGEN_NAME_MAX_LENGTH))}
                                maxLength={ALLERGEN_NAME_MAX_LENGTH}
                                returnKeyType="done"
                                blurOnSubmit
                                onSubmitEditing={Keyboard.dismiss}
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                        </Flex>

                        <Flex justify="between" align="center" style={styles.severityRow}>
                            <Text style={styles.sectionLabel}>严重程度</Text>
                            <Flex style={styles.typeList}>
                                {SEVERITY_OPTIONS.map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.typeItem, severity === item && styles.typeItemActive]}
                                        onPress={() => setSeverity(item)}>
                                        <Text style={[styles.typeItemText, severity === item && styles.typeItemTextActive]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </Flex>
                        </Flex>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>过敏症状</Text>
                            <TextInput
                                style={styles.textareaBox}
                                placeholder="如：皮疹、呼吸困难、皮肤瘙痒"
                                placeholderTextColor="#999999"
                                value={allergicSymptoms}
                                onChangeText={setAllergicSymptoms}
                                multiline
                                textAlignVertical="top"
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.bottomBarButton, submitting && { opacity: 0.6 }]}
                    activeOpacity={0.7}
                    onPress={submit}
                    disabled={submitting}>
                    <Flex style={{ flex: 1 }} justify="center" align="center">
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Image
                                    style={styles.bottomBarButtonImg}
                                    source={require('@/assets/images/schedule/save.png')}
                                />
                                <Text style={styles.bottomBarButtonText}>{isEdit ? '保存修改' : '确认添加'}</Text>
                            </>
                        )}
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}

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
import { getFamilyMedicalInfo, updateFamilyMedical, type FamilyMedicalItem } from '@/api/familyMedical';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/familyHistoryAdd';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import {
    DISEASE_OPTIONS,
    RELATION_OPTIONS,
    STATUS_OPTIONS,
    parseMedicalCondition,
} from './utils/familyHistoryHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'FamilyHistoryAdd'>;

export default function FamilyHistoryAddPage({ route }: Props) {
    const editIndex = route.params?.editIndex;
    const isEdit = editIndex != null;
    const navigation = useNavigation<Nav>();
    const [relation, setRelation] = useState<string>(RELATION_OPTIONS[0]);
    const [diseases, setDiseases] = useState<string[]>([]);
    const [otherDisease, setOtherDisease] = useState('');
    const [age, setAge] = useState('');
    const [status, setStatus] = useState<string>(STATUS_OPTIONS[0]);
    const [submitting, setSubmitting] = useState(false);
    const [initializing, setInitializing] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) {
            return;
        }
        navigation.setOptions({ title: '编辑家族病史' });
        (async () => {
            try {
                const res = await getFamilyMedicalInfo();
                const data = apiResourceData<{
                    familyMedicalList?: FamilyMedicalItem[];
                }>(res as { code?: number; data?: { familyMedicalList?: FamilyMedicalItem[] } });
                const item = data?.familyMedicalList?.[editIndex!];
                if (!item) {
                    return;
                }
                setRelation(item.familyRelationships ?? RELATION_OPTIONS[0]);
                const parsed = parseMedicalCondition(item.medicalCondition);
                setDiseases(parsed.diseases);
                setOtherDisease(parsed.otherDisease);
                setAge(item.age != null ? String(item.age) : '');
                setStatus(item.status ?? STATUS_OPTIONS[0]);
            } catch {
                Alert.alert('错误', '加载记录失败');
            } finally {
                setInitializing(false);
            }
        })();
    }, [editIndex, isEdit, navigation]);

    const toggleDisease = (disease: string) => {
        setDiseases(prev =>
            prev.includes(disease) ? prev.filter(item => item !== disease) : [...prev, disease],
        );
    };

    const submit = async () => {
        const ageNum = Number.parseInt(age.trim(), 10);
        const conditionParts = [...diseases];
        if (otherDisease.trim()) {
            conditionParts.push(otherDisease.trim());
        }

        if (!relation) {
            Alert.alert('提示', '请选择亲属关系');
            return;
        }
        if (conditionParts.length === 0) {
            Alert.alert('提示', '请选择或填写患病情况');
            return;
        }
        if (!age.trim() || Number.isNaN(ageNum) || ageNum < 0) {
            Alert.alert('提示', '请输入有效年龄');
            return;
        }
        if (!status) {
            Alert.alert('提示', '请选择状态');
            return;
        }

        setSubmitting(true);
        try {
            const res = await getFamilyMedicalInfo();
            const data = apiResourceData<{
                userId?: number;
                familyMedicalList?: FamilyMedicalItem[];
            }>(res as { code?: number; data?: { userId?: number; familyMedicalList?: FamilyMedicalItem[] } });
            const current = Array.isArray(data?.familyMedicalList) ? [...data!.familyMedicalList!] : [];

            const item: FamilyMedicalItem = {
                familyRelationships: relation,
                medicalCondition: conditionParts.join(','),
                age: ageNum,
                status,
            };

            if (isEdit) {
                current[editIndex!] = item;
            } else {
                current.push(item);
            }

            const updateRes = await updateFamilyMedical({
                userId: data?.userId,
                familyMedicalList: current,
            });
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
                    <View style={[styles.rowBox, { paddingBottom: 0 }]}>
                        <View style={[styles.formSection, styles.formSectionFirst]}>
                            <Text style={styles.sectionLabel}>亲属关系</Text>
                            <View style={styles.typeList}>
                                {RELATION_OPTIONS.map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.typeItem, relation === item && styles.typeItemActive]}
                                        onPress={() => setRelation(item)}>
                                        <Text style={[styles.typeItemText, relation === item && styles.typeItemTextActive]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>患病情况（可多选）</Text>
                            <View style={styles.typeList}>
                                {DISEASE_OPTIONS.map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.typeItem, diseases.includes(item) && styles.typeItemActive]}
                                        onPress={() => toggleDisease(item)}>
                                        <Text
                                            style={[
                                                styles.typeItemText,
                                                diseases.includes(item) && styles.typeItemTextActive,
                                            ]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Flex justify="between" align="center" style={[styles.formRow, styles.formRowBorder]}>
                            <Text style={styles.formRowLabel} numberOfLines={1}>
                                其他疾病
                            </Text>
                            <TextInput
                                style={styles.formRowInput}
                                placeholder="请输入其他疾病"
                                placeholderTextColor="#999999"
                                value={otherDisease}
                                onChangeText={setOtherDisease}
                                returnKeyType="done"
                                blurOnSubmit
                                onSubmitEditing={Keyboard.dismiss}
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                        </Flex>

                        <Flex justify="between" align="center" style={[styles.formRow, styles.formRowBorder]}>
                            <Text style={styles.formRowLabel} numberOfLines={1}>
                                年龄
                            </Text>
                            <TextInput
                                style={styles.formRowInput}
                                placeholder="如：65"
                                placeholderTextColor="#999999"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                blurOnSubmit
                                onSubmitEditing={Keyboard.dismiss}
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                        </Flex>

                        <Flex justify="between" align="center" style={styles.statusRow}>
                            <Text style={styles.sectionLabel}>状态</Text>
                            <Flex style={styles.typeListInline}>
                                {STATUS_OPTIONS.map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.statusItem, status === item && styles.typeItemActive]}
                                        onPress={() => setStatus(item)}>
                                        <Text style={[styles.typeItemText, status === item && styles.typeItemTextActive]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </Flex>
                        </Flex>
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

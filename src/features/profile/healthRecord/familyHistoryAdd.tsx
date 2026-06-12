import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { getFamilyMedicalInfo, updateFamilyMedical, type FamilyMedicalItem } from '@/api/familyMedical';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergies';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'FamilyHistoryAdd'>;

const RELATION_OPTIONS = ['父亲', '母亲', '祖父', '祖母', '外祖父', '外祖母', '兄弟', '姐妹', '其他'] as const;
const DISEASE_OPTIONS = ['高血压', '糖尿病', '冠心病', '癌症', '心脏病', '肺病', '肝病', '肾病', '精神疾病'] as const;
const STATUS_OPTIONS = ['在世', '已故'] as const;

function parseMedicalCondition(condition?: string) {
    if (!condition) {
        return { diseases: [] as string[], otherDisease: '' };
    }
    const known: string[] = [];
    const other: string[] = [];
    for (const part of condition.split(',').map(s => s.trim()).filter(Boolean)) {
        if ((DISEASE_OPTIONS as readonly string[]).includes(part)) {
            known.push(part);
        } else {
            other.push(part);
        }
    }
    return { diseases: known, otherDisease: other.join(',') };
}

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
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>亲属关系</Text>
                        <View style={styles.chipGrid}>
                            {RELATION_OPTIONS.map((item, index) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.yzBox,
                                        styles.chipItem,
                                        index % 3 === 2 && styles.chipItemLastInRow,
                                        relation === item && styles.yzBoxActive,
                                    ]}
                                    onPress={() => setRelation(item)}>
                                    <Text style={[styles.yzText, relation === item && styles.yzTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View>
                        <Text style={styles.rowTitle}>患病情况（可多选）</Text>
                        <View style={styles.chipGrid}>
                            {DISEASE_OPTIONS.map((item, index) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.yzBox,
                                        styles.chipItem,
                                        index % 3 === 2 && styles.chipItemLastInRow,
                                        diseases.includes(item) && styles.yzBoxActive,
                                    ]}
                                    onPress={() => toggleDisease(item)}>
                                    <Text style={[styles.yzText, diseases.includes(item) && styles.yzTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Flex style={{ marginTop: 10 }}>
                        <Text style={styles.rowTitle}>其他疾病</Text>
                        <View style={{ flex: 1 }}>
                            <TextInput
                                style={[styles.inputBox, { textAlign: 'right' }]}
                                placeholder="请输入其他疾病"
                                placeholderTextColor={AppTheme.textSecondary}
                                value={otherDisease}
                                onChangeText={setOtherDisease}
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                            <View style={styles.rowLine} />
                        </View>
                    </Flex>

                    <Flex style={{ marginTop: 10 }}>
                        <Text style={styles.rowTitle}>年龄</Text>
                        <View style={{ flex: 1 }}>
                            <TextInput
                                style={[styles.inputBox, { textAlign: 'right' }]}
                                placeholder="如：65"
                                placeholderTextColor={AppTheme.textSecondary}
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                            <View style={styles.rowLine} />
                        </View>
                    </Flex>

                    <View>
                        <Text style={styles.rowTitle}>状态</Text>
                        <Flex justify="between" >
                            {STATUS_OPTIONS.map((item, index) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.yzBox,
                                        styles.chipItem,
                                        {width: '43%'},
                                        index % 3 === 2 && styles.chipItemLastInRow,
                                        status === item && styles.yzBoxActive,
                                    ]}
                                    onPress={() => setStatus(item)}>
                                    <Text style={[styles.yzText, status === item && styles.yzTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>
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
        </SafeAreaView>
    );
}

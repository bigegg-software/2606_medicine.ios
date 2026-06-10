import React, { useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, DatePicker, Switch } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import styles from '@/css/chronicDisease/add';
import { AppTheme } from '@/common/theme';
import { MaterialIcons } from '@expo/vector-icons';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

const CHRONIC_TYPE_GROUPS = [
    { title: null, options: ['高血脂', '高血压', '冠心病'] },
    { title: '血糖类', options: ['糖尿病', '糖耐量异常'] },
    { title: '呼吸类', options: ['哮喘', '慢阻肺'] },
    { title: '心理睡眠类', options: ['焦虑', '失眠', '抑郁倾向'] },
    { title: '其他', options: ['肥胖', '甲状腺疾病', '其他'] },
];

const STATUS_LIST = ['稳定', '控制中', '波动较大', '恶化中', '已恢复'];

const FREQUENCY_LIST = ['每日1次', '每日2次', '每日3次', '每周1次', '需要时服用'];

const SYMPTOM_LIST = ['头晕', '心慌', '失眠', '疲劳', '胸闷', '情绪低落', '无明显症状'];

function OptionChip({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.typeItem, active && styles.typeItemActive]}
            onPress={onPress}>
            <Flex style={{ flex: 1 }}>
                <Text style={[styles.typeItemText, active && styles.typeItemTextActive]}>{label}</Text>
            </Flex>
        </TouchableOpacity>
    );
}

export default function ChronicDiseaseAddPage() {
    const navigation = useNavigation();
    const [chronicType, setChronicType] = useState('高血压');
    const [diagnosisDate, setDiagnosisDate] = useState(moment('2026-05-21').format('YYYY-MM-DD'));
    const [currentStatus, setCurrentStatus] = useState('控制中');
    const [longTermManagement, setLongTermManagement] = useState(true);
    const [currentMedication, setCurrentMedication] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('每日1次');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [medicationExpanded, setMedicationExpanded] = useState(true);
    const [symptomExpanded, setSymptomExpanded] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const toggleSymptom = (item: string) => {
        setSymptoms(prev => {
            if (item === '无明显症状') {
                return prev.includes(item) ? [] : [item];
            }
            const next = prev.filter(value => value !== '无明显症状');
            return next.includes(item) ? next.filter(value => value !== item) : [...next, item];
        });
    };

    const submit = () => {
        setSubmitting(true);
        navigation.goBack();
        setSubmitting(false);
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <View style={styles.rowBox}>
                    <Text style={styles.sectionTitle}>基础信息</Text>

                    <Text style={styles.rowTitle}>慢病类型</Text>
                    {CHRONIC_TYPE_GROUPS.map(group => (
                        <View key={group.title ?? 'default'}>
                            {group.title ? <Text style={styles.rowTitle}>{group.title}</Text> : null}
                            <Flex wrap="wrap" style={{ marginTop: 12, gap: 8 }}>
                                {group.options.map(item => (
                                    <OptionChip
                                        key={item}
                                        label={item}
                                        active={chronicType === item}
                                        onPress={() => setChronicType(item)}
                                    />
                                ))}
                            </Flex>
                        </View>
                    ))}
                    <View style={styles.rowLineInHeader} />

                    <DatePicker
                        precision="day"
                        value={moment(diagnosisDate, 'YYYY-MM-DD').toDate()}
                        onOk={date => setDiagnosisDate(moment(date).format('YYYY-MM-DD'))}>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Flex justify="between" align="center">
                                <Text style={styles.rowTitle}>确诊时间</Text>
                                <Flex align="center" style={styles.rowTitle}>
                                    <Text style={styles.dateValue}>
                                        {moment(diagnosisDate).format('YYYY年M月D日')}
                                    </Text>
                                    <Image source={require('@/assets/images/user/icon-rl.png')} style={styles.calendarIcon} />
                                </Flex>
                            </Flex>
                        </TouchableOpacity>
                    </DatePicker>
                    <View style={styles.rowLineInHeader} />

                    <Text style={styles.rowTitle}>当前状态</Text>
                    <Flex wrap="wrap" style={{ marginTop: 12, gap: 8 }}>
                        {STATUS_LIST.map(item => (
                            <OptionChip
                                key={item}
                                label={item}
                                active={currentStatus === item}
                                onPress={() => setCurrentStatus(item)}
                            />
                        ))}
                    </Flex>
                    <View style={styles.rowLineInHeader} />

                    <Flex justify="between" align="center" style={{ marginBottom: 12 }}>
                        <Text style={styles.rowTitle}>是否长期管理</Text>
                        <Switch
                            style={styles.switch}
                            checked={longTermManagement}
                            onChange={setLongTermManagement}
                            color={AppTheme.primaryColor}
                        />
                    </Flex>
                </View>

                <View style={styles.rowBox}>
                    <Flex justify="between" align="center" style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, styles.sectionTitleInHeader]}>用药管理</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setMedicationExpanded(prev => !prev)}>
                            <Flex align="center">
                                <MaterialIcons
                                    name={medicationExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                    size={30}
                                    color={AppTheme.primaryColor}
                                />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>
                    {medicationExpanded ? (
                        <>
                            <View>
                                <Text style={styles.rowTitle}>当前用药</Text>
                                <TextInput
                                    style={styles.inputBox}
                                    placeholder="例如：氨氯地平"
                                    placeholderTextColor={AppTheme.textSecondary}
                                    value={currentMedication}
                                    onChangeText={setCurrentMedication}
                                    inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                                />
                            </View>
                            <View style={styles.rowLine} />

                            <View>
                                <Text style={styles.rowTitle}>剂量</Text>
                                <TextInput
                                    style={styles.inputBox}
                                    placeholder="例如:5mg"
                                    placeholderTextColor={AppTheme.textSecondary}
                                    value={dosage}
                                    onChangeText={setDosage}
                                    inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                                />
                            </View>
                            <View style={styles.rowLine} />

                            <Text style={styles.rowTitle}>服用频率</Text>
                            <Flex wrap="wrap" style={[styles.inlineRow, { marginTop: 12, gap: 8 }]}>
                                {FREQUENCY_LIST.map(item => (
                                    <OptionChip
                                        key={item}
                                        label={item}
                                        active={frequency === item}
                                        onPress={() => setFrequency(item)}
                                    />
                                ))}
                            </Flex>
                        </>
                    ) : null}
                </View>

                <View style={styles.rowBox}>
                    <Flex justify="between" align="center" style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, styles.sectionTitleInHeader]}>症状信息</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setSymptomExpanded(prev => !prev)}>
                            <Flex align="center">
                                <MaterialIcons
                                    name={symptomExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                    size={30}
                                    color={AppTheme.primaryColor}
                                />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>
                    {symptomExpanded ? (
                        <>
                            <Text style={styles.rowTitle}>可多选</Text>
                            <Flex wrap="wrap" style={[styles.inlineRow, { marginTop: 12, gap: 8 }]}>
                                {SYMPTOM_LIST.map(item => (
                                    <OptionChip
                                        key={item}
                                        label={item}
                                        active={symptoms.includes(item)}
                                        onPress={() => toggleSymptom(item)}
                                    />
                                ))}
                            </Flex>
                        </>
                    ) : null}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.addText}>添加慢病</Text>
                    )}
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

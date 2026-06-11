import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, DatePicker, Picker } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/vitals/add';
import { AppTheme } from '@/common/theme';
import { addMeasureData, removeMeasureDataById, updateMeasureData, type AddMeasureDataResult, type MeasureDataType, } from '@/api/measureData';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AddDataPage'>;

const MEASURE_SITE_LIST = ['左臂', '右臂'];

const MEASURE_CONFIG: Record<
  MeasureDataType,
  {
    title: string;
    primaryLabel: string;
    secondaryLabel?: string;
    showSecondary: boolean;
    showSite: boolean;
    showStatus: boolean;
    statusList: string[];
    defaultStatus: string;
    referenceLines: string[];
    keyboardType: 'number-pad' | 'decimal-pad';
  }
> = {
  血压: {
    title: '新增血压记录',
    primaryLabel: '收缩压（高压）mmHg',
    secondaryLabel: '舒张压（低压）mmHg',
    showSecondary: true,
    showSite: true,
    showStatus: true,
    statusList: ['静息', '运动后', '情绪紧张', '睡前'],
    defaultStatus: '静息',
    referenceLines: ['正常:<120/80 mmHg', '偏高:120-139/80-89 mmHg', '高血压:>=140/90 mmHg'],
    keyboardType: 'number-pad',
  },
  血糖: {
    title: '新增血糖记录',
    primaryLabel: '血糖 mmol/L',
    showSecondary: false,
    showSite: false,
    showStatus: true,
    statusList: ['空腹', '餐前', '餐后', '睡前', '凌晨'],
    defaultStatus: '餐前',
    referenceLines: [
      '正常（空腹）：3.9-6.1 mmol/L',
      '偏高（空腹）：6.1-7.0 mmol/L',
      '糖尿病：>=7.0 mmol/L',
    ],
    keyboardType: 'decimal-pad',
  },
  体温: {
    title: '新增体温记录',
    primaryLabel: '体温 ℃',
    showSecondary: false,
    showSite: false,
    showStatus: false,
    statusList: [],
    defaultStatus: '',
    referenceLines: [
      '正常：36.0°C – 37.2°C',
      '偏高：37.3°C – 37.9°C',
      '发热：≥38.0°C',
      '偏低：＜36.0°C',
    ],
    keyboardType: 'decimal-pad',
  },
  尿酸: {
    title: '新增尿酸记录',
    primaryLabel: '尿酸 μmol/L',
    showSecondary: false,
    showSite: false,
    showStatus: true,
    statusList: ['空腹', '餐后', '其他'],
    defaultStatus: '空腹',
    referenceLines: [
      '正常（男）：208-428 μmol/L',
      '正常（女）：155-357 μmol/L',
      '偏高：高于上述范围',
    ],
    keyboardType: 'number-pad',
  },
  血脂: {
    title: '新增血脂记录',
    primaryLabel: '总胆固醇（TC）mmol/L',
    showSecondary: false,
    showSite: false,
    showStatus: false,
    statusList: [],
    defaultStatus: '',
    referenceLines: [
      '理想：总胆固醇 <5.2 mmol/L',
      '边缘升高：5.2-6.2 mmol/L',
      '升高：≥6.2 mmol/L',
    ],
    keyboardType: 'decimal-pad',
  },
};

const TIME_PICKER_DATA = [
  Array.from({ length: 24 }, (_, hour) => ({
    label: String(hour).padStart(2, '0'),
    value: hour,
  })),
  Array.from({ length: 60 }, (_, minute) => ({
    label: String(minute).padStart(2, '0'),
    value: minute,
  })),
];

function parseTimeValue(time: string): [number, number] {
  const m = moment(time, 'HH:mm', true);
  return m.isValid() ? [m.hour(), m.minute()] : [moment().hour(), moment().minute()];
}

function sanitizeNumberInput(text: string, allowDecimal: boolean) {
  if (allowDecimal) {
    return text.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
  }
  return text.replace(/[^\d]/g, '');
}

function formatEditMeasureValue(value: number | undefined, type: MeasureDataType) {
  if (value == null) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (type === '血压') return String(Math.round(num));
  if (type === '体温' || type === '血脂') return num.toFixed(2);
  if (type === '尿酸') return String(Math.round(num));
  return String(value);
}

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
      <Text style={[styles.typeItemText, active && styles.typeItemTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function BloodAddPage({ route }: Props) {
  const measureType = route.params?.type ?? '血压';
  const editItem = route.params?.item;
  const isEdit = editItem?.id != null;
  const config = MEASURE_CONFIG[measureType];
  const navigation = useNavigation<Nav>();
  const allowDecimal = config.keyboardType === 'decimal-pad';
  const pageTitle = isEdit ? config.title.replace('新增', '编辑') : config.title;

  const [measureDate, setMeasureDate] = useState(moment().format('YYYY-MM-DD'));
  const [measureTime, setMeasureTime] = useState(moment().format('HH:mm'));
  const [primaryValue, setPrimaryValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');
  const [lipidTg, setLipidTg] = useState('');
  const [lipidHdl, setLipidHdl] = useState('');
  const [lipidLdl, setLipidLdl] = useState('');
  const [measureSite, setMeasureSite] = useState('左臂');
  const [measureStatus, setMeasureStatus] = useState(config.defaultStatus);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!editItem) return;
    if (editItem.customerLocalDate) setMeasureDate(editItem.customerLocalDate);
    if (editItem.dataTime) setMeasureTime(editItem.dataTime);
    if (editItem.val != null) {
      setPrimaryValue(formatEditMeasureValue(
        measureType === '血脂' ? (editItem.xuezhiTc ?? editItem.val) : editItem.val,
        measureType,
      ));
    }
    if (editItem.val2 != null) {
      setSecondaryValue(formatEditMeasureValue(editItem.val2, measureType));
    }
    if (measureType === '血脂') {
      if (editItem.xuezhiTg != null) setLipidTg(formatEditMeasureValue(editItem.xuezhiTg, measureType));
      if (editItem.xuezhiHdlC != null) setLipidHdl(formatEditMeasureValue(editItem.xuezhiHdlC, measureType));
      if (editItem.xuezhiLdlC != null) setLipidLdl(formatEditMeasureValue(editItem.xuezhiLdlC, measureType));
    }
    if (editItem.measuringSite) setMeasureSite(editItem.measuringSite);
    setMeasureStatus(editItem.measurementStatus || config.defaultStatus);
    setRemark(editItem.remark ?? '');
  }, [config.defaultStatus, editItem, measureType]);

  const remove = useCallback(() => {
    if (editItem?.id == null) return;
    Alert.alert('删除记录', '确定删除该测量记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = (await removeMeasureDataById(editItem.id!)) as unknown as AddMeasureDataResult;
            if (!isResourceApiOk(res)) {
              Alert.alert('删除失败', res?.msg || '请稍后重试');
              return;
            }
            navigation.goBack();
          } catch {
            Alert.alert('错误', '删除失败');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [editItem?.id, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: pageTitle,
      headerRight: isEdit
        ? () => (
          <TouchableOpacity
            onPress={remove}
            disabled={deleting || submitting}
            style={{ marginRight: 16 }}>
            {deleting ? (
              <ActivityIndicator size="small" color={AppTheme.dangerColor} />
            ) : (
              <Text style={{ color: AppTheme.dangerColor, fontSize: 16 }}>删除</Text>
            )}
          </TouchableOpacity>
        )
        : undefined,
    });
  }, [deleting, isEdit, navigation, pageTitle, remove, submitting]);

  const referenceLines = useMemo(() => config.referenceLines, [config.referenceLines]);

  const submit = async () => {
    if (!primaryValue.trim()) {
      Alert.alert('提示', `请填写${config.primaryLabel}`);
      return;
    }
    if (config.showSecondary && !secondaryValue.trim()) {
      Alert.alert('提示', `请填写${config.secondaryLabel}`);
      return;
    }

    const val = Number(primaryValue);
    if (!Number.isFinite(val)) {
      Alert.alert('提示', '请输入有效的测量值');
      return;
    }

    let val2: number | undefined;
    if (config.showSecondary) {
      val2 = Number(secondaryValue);
      if (!Number.isFinite(val2)) {
        Alert.alert('提示', '请输入有效的测量值');
        return;
      }
    }

    if (measureType === '血脂') {
      const optionalFields = [
        { label: '甘油三酯（TG）', value: lipidTg },
        { label: '高密度脂蛋白（HDL-C）', value: lipidHdl },
        { label: '低密度脂蛋白（LDL-C）', value: lipidLdl },
      ];
      for (const field of optionalFields) {
        if (field.value.trim() && !Number.isFinite(Number(field.value))) {
          Alert.alert('提示', `请输入有效的${field.label}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        type: measureType,
        customerLocalDate: measureDate,
        dataTime: measureTime,
        val,
        val2,
        measurementStatus: config.showStatus ? measureStatus : '',
        measuringSite: config.showSite ? measureSite : '',
        remark: remark.trim(),
        ...(measureType === '血脂'
          ? {
              xuezhiTc: val,
              ...(lipidTg.trim() ? { xuezhiTg: Number(lipidTg) } : {}),
              ...(lipidHdl.trim() ? { xuezhiHdlC: Number(lipidHdl) } : {}),
              ...(lipidLdl.trim() ? { xuezhiLdlC: Number(lipidLdl) } : {}),
            }
          : {}),
      };
      const res = (await (isEdit
        ? updateMeasureData({ ...payload, id: editItem!.id! })
        : addMeasureData(payload))) as unknown as AddMeasureDataResult;
      if (!isResourceApiOk(res)) {
        Alert.alert('提示', res?.msg || (isEdit ? '保存失败' : '添加失败'));
        return;
      }
      navigation.goBack();
    } catch {
      Alert.alert('错误', isEdit ? '保存失败' : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardDoneAccessory />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.rowBox}>
          <Text style={styles.sectionTitle}>测量时间</Text>

          <DatePicker
            precision="day"
            value={moment(measureDate, 'YYYY-MM-DD').toDate()}
            onOk={date => setMeasureDate(moment(date).format('YYYY-MM-DD'))}>
            <TouchableOpacity activeOpacity={0.7}>
              <Flex justify="between" align="center">
                <Text style={styles.rowTitle}>日期</Text>
                <Flex align="center" style={styles.rowTitle}>
                  <Text style={styles.dateValue}>
                    {moment(measureDate).format('YYYY年M月D日')}
                  </Text>
                  <Image source={require('@/assets/images/user/icon-rl.png')} style={styles.calendarIcon} />
                </Flex>
              </Flex>
            </TouchableOpacity>
          </DatePicker>
          <View style={styles.rowLineInHeader} />
          <Picker
            data={TIME_PICKER_DATA}
            cols={2}
            cascade={false}
            value={parseTimeValue(measureTime)}
            onOk={values => {
              const hour = String(Number(values[0])).padStart(2, '0');
              const minute = String(Number(values[1])).padStart(2, '0');
              setMeasureTime(`${hour}:${minute}`);
            }}>
            <TouchableOpacity activeOpacity={0.7}>
              <Flex justify="between" align="center">
                <Text style={styles.rowTitle}>时间</Text>
                <Flex align="center" style={styles.rowTitle}>
                  <Text style={styles.dateValue}>{measureTime}</Text>
                  <Image source={require('@/assets/images/user/nl.png')} style={styles.calendarIcon} />
                </Flex>
              </Flex>
            </TouchableOpacity>
          </Picker>
        </View>

        <View style={styles.rowBox}>
          <Text style={styles.sectionTitle}>{config.primaryLabel}</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="--"
            placeholderTextColor={AppTheme.textSecondary}
            value={primaryValue}
            onChangeText={text => setPrimaryValue(sanitizeNumberInput(text, allowDecimal))}
            keyboardType={config.keyboardType}
            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
          />

          {config.showSecondary ? (
            <>
              <Text style={styles.sectionTitle}>{config.secondaryLabel}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="--"
                placeholderTextColor={AppTheme.textSecondary}
                value={secondaryValue}
                onChangeText={text => setSecondaryValue(sanitizeNumberInput(text, false))}
                keyboardType="number-pad"
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
            </>
          ) : null}

          {measureType === '血脂' ? (
            <>
              <Text style={styles.sectionTitle}>甘油三酯（TG）mmol/L</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="--"
                placeholderTextColor={AppTheme.textSecondary}
                value={lipidTg}
                onChangeText={text => setLipidTg(sanitizeNumberInput(text, true))}
                keyboardType="decimal-pad"
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
              <Text style={styles.sectionTitle}>高密度脂蛋白（HDL-C）mmol/L</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="--"
                placeholderTextColor={AppTheme.textSecondary}
                value={lipidHdl}
                onChangeText={text => setLipidHdl(sanitizeNumberInput(text, true))}
                keyboardType="decimal-pad"
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
              <Text style={styles.sectionTitle}>低密度脂蛋白（LDL-C）mmol/L</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="--"
                placeholderTextColor={AppTheme.textSecondary}
                value={lipidLdl}
                onChangeText={text => setLipidLdl(sanitizeNumberInput(text, true))}
                keyboardType="decimal-pad"
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
            </>
          ) : null}

          {config.showSite ? (
            <>
              <Text style={styles.sectionTitle}>测量部位</Text>
              <View style={styles.siteRow}>
                {MEASURE_SITE_LIST.map(item => {
                  const active = measureSite === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.siteItem, active && styles.siteItemActive]}
                      onPress={() => setMeasureSite(item)}>
                      <Text style={[styles.siteItemText, active && styles.siteItemTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          {config.showStatus ? (
            <>
              <Text style={styles.sectionTitle}>测量状态</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusRow}>
                {config.statusList.map(item => (
                  <OptionChip
                    key={item}
                    label={item}
                    active={measureStatus === item}
                    onPress={() => setMeasureStatus(item)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>备注（选填）</Text>
          <TextInput
            style={styles.textareaBox}
            placeholder="选填"
            placeholderTextColor={AppTheme.textSecondary}
            value={remark}
            onChangeText={setRemark}
            multiline
            textAlignVertical="top"
            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
          />
        </View>

        <View>
          <Text style={styles.btmTitle}>参考标准:</Text>
          {referenceLines.map(line => (
            <Text key={line} style={styles.btmText}>
              {line}
            </Text>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting || deleting}>
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addText}>{isEdit ? '保存' : '添加记录'}</Text>
          )}
        </Flex>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, DatePicker, Picker } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/vitals/add';
import { AppTheme } from '@/common/theme';
import { addMeasureData, removeMeasureDataById, updateMeasureData, type AddMeasureDataResult, type MeasureDataType, } from '@/api/measureData';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserBaseInfo } from '@/store/actions/user';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import {
  BLOOD_SUGAR_MEASURE_STATUS_LIST,
  BLOOD_PRESSURE_INPUT_MAX_LENGTH,
  formatBloodPressureEditValue,
  getBloodPressureReferenceLines,
  getBloodSugarReferenceLines,
  sanitizeBloodPressureInput,
  toBloodSugarMeasureStatusLabel,
  toBloodSugarMeasureStatusValue,
} from './addDataHelpers';
import { getUricAcidAddDataReferenceLines } from './detail/helpers/uricAcid';
import { syncMeasureWeightToUserBaseInfo } from './utils/weightSyncHelpers';
import { formatWeightBmiHintText, hasUserHeightForBmi } from './utils/weightBmiHintHelpers';
import TopHeaderTip from './detail/components/TopHeaderTip';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AddDataPage'>;

const MEASURE_SITE_LIST = ['左臂', '右臂'];

const MEASURE_CONFIG: Record<
  MeasureDataType,
  {
    title: string;
    primaryLabel: string;
    primaryUnit: string;
    secondaryLabel?: string;
    secondaryUnit?: string;
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
    primaryLabel: '收缩压（高压）',
    primaryUnit: 'mmHg',
    secondaryLabel: '舒张压（低压）',
    secondaryUnit: 'mmHg',
    showSecondary: true,
    showSite: true,
    showStatus: true,
    statusList: ['静息', '运动后', '情绪紧张', '睡前'],
    defaultStatus: '静息',
    referenceLines: [],
    keyboardType: 'number-pad',
  },
  血糖: {
    title: '新增血糖记录',
    primaryLabel: '血糖',
    primaryUnit: 'mmol/L',
    showSecondary: false,
    showSite: false,
    showStatus: true,
    statusList: [...BLOOD_SUGAR_MEASURE_STATUS_LIST],
    defaultStatus: '餐前',
    referenceLines: [],
    keyboardType: 'decimal-pad',
  },
  体温: {
    title: '新增体温记录',
    primaryLabel: '体温',
    primaryUnit: '℃',
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
    primaryLabel: '尿酸',
    primaryUnit: 'μmol/L',
    showSecondary: false,
    showSite: false,
    showStatus: true,
    statusList: ['空腹', '餐后', '其他'],
    defaultStatus: '空腹',
    referenceLines: [],
    keyboardType: 'number-pad',
  },
  血脂: {
    title: '新增血脂记录',
    primaryLabel: '总胆固醇（TC）',
    primaryUnit: 'mmol/L',
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
  体重: {
    title: '新增体重记录',
    primaryLabel: '体重',
    primaryUnit: 'kg',
    showSecondary: false,
    showSite: false,
    showStatus: false,
    statusList: [],
    defaultStatus: '',
    referenceLines: [
      'BMI 正常：18.5 – 23.9',
      '偏瘦：<18.5',
      '超重：24.0 – 27.9',
      '肥胖：≥28.0',
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
  if (type === '体重') return num.toFixed(1);
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

function FormValueRow({
  title,
  unit,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  showDivider = true,
}: {
  title: string;
  unit: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType: 'number-pad' | 'decimal-pad';
  maxLength?: number;
  showDivider?: boolean;
}) {
  return (
    <>
      <Flex justify="between" align="center" style={styles.formRow}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Flex align="center" style={styles.formRowRight}>
          <TextInput
            style={styles.formInput}
            placeholder="--"
            placeholderTextColor="rgba(204,204,204,0.8)"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            maxLength={maxLength}
            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
          />
          <Text style={styles.formUnit}>{unit}</Text>
        </Flex>
      </Flex>
      {showDivider ? <View style={styles.rowLineInHeader} /> : null}
    </>
  );
}

export default function BloodAddPage({ route }: Props) {
  const measureType = route.params?.type ?? '血压';
  const editItem = route.params?.item;
  const isEdit = editItem?.id != null;
  const config = MEASURE_CONFIG[measureType];
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const headerHeight = useHeaderHeight();
  const userGender = useSelector((state: RootState) => state.user.info?.gender);
  const userHeight = useSelector((state: RootState) => state.user.info?.height);
  const showWeightHeightTip = measureType === '体重' && !hasUserHeightForBmi(userHeight);
  const scrollRef = useRef<ScrollView>(null);
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
  const weightBmiHint = useMemo(
    () => formatWeightBmiHintText(primaryValue, userHeight),
    [primaryValue, userHeight],
  );

  const scrollToRemarkInput = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  }, []);

  useEffect(() => {
    if (!editItem) return;
    if (editItem.customerLocalDate) setMeasureDate(editItem.customerLocalDate);
    if (editItem.dataTime) setMeasureTime(editItem.dataTime);
    if (editItem.val != null) {
      if (measureType === '血压') {
        setPrimaryValue(formatBloodPressureEditValue(editItem.val));
      } else {
        const rawVal = measureType === '血脂' ? (editItem.xuezhiTc ?? editItem.val) : editItem.val;
        setPrimaryValue(formatEditMeasureValue(rawVal, measureType));
      }
    }
    if (editItem.val2 != null) {
      setSecondaryValue(
        measureType === '血压'
          ? formatBloodPressureEditValue(editItem.val2)
          : formatEditMeasureValue(editItem.val2, measureType),
      );
    }
    if (measureType === '血脂') {
      if (editItem.xuezhiTg != null) setLipidTg(formatEditMeasureValue(editItem.xuezhiTg, measureType));
      if (editItem.xuezhiHdlC != null) setLipidHdl(formatEditMeasureValue(editItem.xuezhiHdlC, measureType));
      if (editItem.xuezhiLdlC != null) setLipidLdl(formatEditMeasureValue(editItem.xuezhiLdlC, measureType));
    }
    if (editItem.measuringSite) setMeasureSite(editItem.measuringSite);
    setMeasureStatus(
      measureType === '血糖'
        ? toBloodSugarMeasureStatusLabel(editItem.measurementStatus || config.defaultStatus)
        : (editItem.measurementStatus || config.defaultStatus),
    );
    setRemark(editItem.remark ?? '');
  }, [config.defaultStatus, editItem, measureType]);

  const remove = useCallback(() => {
    if (editItem?.id == null) return;
    Alert.alert('删除记录', `确定要删除这条${measureType}记录吗？删除后无法恢复`, [
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
  }, [editItem?.id, measureType, navigation]);

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

  const referenceLines = useMemo(() => {
    if (measureType === '血糖') {
      return getBloodSugarReferenceLines(measureStatus);
    }
    if (measureType === '血压') {
      return getBloodPressureReferenceLines();
    }
    if (measureType === '尿酸') {
      return getUricAcidAddDataReferenceLines(userGender);
    }
    return config.referenceLines;
  }, [config.referenceLines, measureStatus, measureType, userGender]);

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
      const requiredFields = [
        { label: '甘油三酯（TG）', value: lipidTg },
        { label: '高密度脂蛋白（HDL-C）', value: lipidHdl },
        { label: '低密度脂蛋白（LDL-C）', value: lipidLdl },
      ];
      for (const field of requiredFields) {
        if (!field.value.trim()) {
          Alert.alert('提示', `请填写${field.label}`);
          return;
        }
        if (!Number.isFinite(Number(field.value))) {
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
        measurementStatus: config.showStatus
          ? (measureType === '血糖' ? toBloodSugarMeasureStatusValue(measureStatus) : measureStatus)
          : '',
        measuringSite: config.showSite ? measureSite : '',
        remark: remark.trim(),
        ...(measureType === '血脂'
          ? {
            xuezhiTc: val,
            xuezhiTg: Number(lipidTg),
            xuezhiHdlC: Number(lipidHdl),
            xuezhiLdlC: Number(lipidLdl),
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

      if (measureType === '体重') {
        try {
          await syncMeasureWeightToUserBaseInfo(val);
          await dispatch(fetchUserBaseInfo());
        } catch (error) {
          console.error('syncMeasureWeightToUserBaseInfo failed:', error);
        }
      }

      navigation.goBack();
    } catch {
      Alert.alert('错误', isEdit ? '保存失败' : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      edges={[]}
      style={styles.container}
      showHeaderBackground={false}
      keyboardAccessory={<KeyboardDoneAccessory />}>
      {showWeightHeightTip ? <TopHeaderTip /> : null}
      <View style={styles.keyboardAvoid}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.rowBox, { paddingBottom: 0 }]}>
              <Text style={styles.sectionTitle}>测量时间</Text>

              <DatePicker
                precision="day"
                value={moment(measureDate, 'YYYY-MM-DD').toDate()}
                onOk={date => setMeasureDate(moment(date).format('YYYY-MM-DD'))}>
                <TouchableOpacity activeOpacity={0.7}>
                  <Flex justify="between" align="center" style={styles.timeRow}>
                    <Text style={styles.rowTitle}>日期</Text>
                    <Flex align="center">
                      <Text style={styles.dateValue}>
                        {moment(measureDate).format('YYYY年M月D日')}
                      </Text>
                      <Image source={require('@/assets/images/vitals/icon_rl.png')} style={styles.calendarIcon} />
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
                  <Flex justify="between" align="center" style={styles.timeRow}>
                    <Text style={styles.rowTitle}>时间</Text>
                    <Flex align="center">
                      <Text style={styles.dateValue}>{measureTime}</Text>
                      <Image source={require('@/assets/images/vitals/icon_time.png')} style={styles.calendarIcon} />
                    </Flex>
                  </Flex>
                </TouchableOpacity>
              </Picker>
            </View>

            <View style={[styles.rowBox, { paddingBottom: 0 }]}>
              {measureType === '体重' ? (
                <Text style={styles.sectionTitle}>体重/BMI</Text>
              ) : null}
              <FormValueRow
                title={config.primaryLabel}
                unit={config.primaryUnit}
                value={primaryValue}
                onChangeText={text => setPrimaryValue(
                  measureType === '血压'
                    ? sanitizeBloodPressureInput(text)
                    : sanitizeNumberInput(text, allowDecimal),
                )}
                keyboardType={measureType === '血压' ? 'decimal-pad' : config.keyboardType}
                maxLength={measureType === '血压' ? BLOOD_PRESSURE_INPUT_MAX_LENGTH : undefined}
                showDivider={
                  measureType === '体重'
                  || config.showSecondary
                  || measureType === '血脂'
                  || config.showSite
                  || config.showStatus
                }
              />

              {measureType === '体重' ? (
                <Flex justify="between" align="center" style={styles.formRow}>
                  <Text style={styles.rowTitle}>BMI</Text>
                  <Text style={styles.bmiHintText} numberOfLines={2}>
                    {weightBmiHint}
                  </Text>
                </Flex>
              ) : null}
              {config.showSecondary ? (
                <FormValueRow
                  title={config.secondaryLabel!}
                  unit={config.secondaryUnit!}
                  value={secondaryValue}
                  onChangeText={text => setSecondaryValue(
                    measureType === '血压'
                      ? sanitizeBloodPressureInput(text)
                      : sanitizeNumberInput(text, false),
                  )}
                  keyboardType={measureType === '血压' ? 'decimal-pad' : 'number-pad'}
                  maxLength={measureType === '血压' ? BLOOD_PRESSURE_INPUT_MAX_LENGTH : undefined}
                  showDivider={config.showSite || config.showStatus}
                />
              ) : null}

              {measureType === '血脂' ? (
                <>
                  <FormValueRow
                    title="甘油三酯（TG）"
                    unit="mmol/L"
                    value={lipidTg}
                    onChangeText={text => setLipidTg(sanitizeNumberInput(text, true))}
                    keyboardType="decimal-pad"
                  />
                  <FormValueRow
                    title="低密度脂蛋白（LDL-C）"
                    unit="mmol/L"
                    value={lipidLdl}
                    onChangeText={text => setLipidLdl(sanitizeNumberInput(text, true))}
                    keyboardType="decimal-pad"
                  />
                  <FormValueRow
                    title="高密度脂蛋白（HDL-C）"
                    unit="mmol/L"
                    value={lipidHdl}
                    onChangeText={text => setLipidHdl(sanitizeNumberInput(text, true))}
                    keyboardType="decimal-pad"
                    showDivider={false}
                  />
                </>
              ) : null}

              {config.showSite ? (
                <>
                  <Flex justify="between" align="center" style={styles.formRow}>
                    <Text style={styles.rowTitle}>测量部位</Text>
                    <View style={styles.siteRowInline}>
                      {MEASURE_SITE_LIST.map(item => {
                        const active = measureSite === item;
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[styles.siteItemInline, active && styles.siteItemActive]}
                            onPress={() => setMeasureSite(item)}>
                            <Text style={[styles.siteItemText, active && styles.siteItemTextActive]}>{item}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Flex>
                  {config.showStatus ? <View style={styles.rowLineInHeader} /> : null}
                </>
              ) : null}

              {config.showStatus ? (
                <Flex justify="between" align="center" style={styles.formRow}>
                  <Text style={styles.rowTitle}>测量状态</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.statusScroll}
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
                </Flex>
              ) : null}
            </View>

            <View style={styles.rowBox}>
              <Text style={styles.sectionTitle}>备注（选填）</Text>
              <TextInput
                style={styles.textareaBox}
                placeholder="选填"
                placeholderTextColor="rgba(204,204,204,0.8)"
                value={remark}
                onChangeText={setRemark}
                multiline
                textAlignVertical="top"
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                onFocus={scrollToRemarkInput}
              />
            </View>

            <View style={styles.btmBox}>
              <Flex justify="center" align="center">
                <Image style={styles.btmIcon} source={require('@/assets/images/vitals/icon_bz.png')} />
                <Text style={styles.btmTitle}>参考标准:</Text>
              </Flex>
              {referenceLines.map(line => (
                <Text key={line} style={styles.btmText}>
                  {line}
                </Text>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, (submitting || deleting) && { opacity: 0.6 }]}
            disabled={submitting || deleting}
            onPress={submit}>
            <Flex style={{ flex: 1 }}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Image
                    style={styles.primaryBtnIcon}
                    source={require('@/assets/images/schedule/save.png')}
                  />
                  <Text style={styles.primaryBtnText}>保存</Text>
                </>
              )}
            </Flex>
          </TouchableOpacity>
        </View>
      </View>
    </PageLayout>
  );
}

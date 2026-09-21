import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, DatePicker, Picker, Toast } from '@ant-design/react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { getUserBaseInfo, updateUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { uploadOss } from '@/api/oss';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDefaultAvatarByGender, maskPhoneNumber } from '@/src/utils/userHelpers';
import { fetchUserBaseInfo } from '@/store/actions/user';
import { useDispatch, useSelector } from 'react-redux';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import type { AppDispatch, RootState } from '@/store/store';
import {
  isSameWeight,
  syncProfileWeightToMeasureData,
} from '@/src/features/profile/vitals/utils/weightSyncHelpers';
import {
  DAILY_ACTIVITY_LEVEL_PICKER_DATA,
  resolveDailyActivityLevelLabel,
} from '@/src/features/profile/healthRecord/utils/profileActivityLevelHelpers';
import {
  buildFitnessLevelPickerData,
  buildTrainingGoalOptions,
  loadFitnessLevelDictItems,
  loadTrainingGoalDictItems,
  normalizeTrainingGoals,
} from '@/src/features/profile/healthRecord/utils/profileExtraFieldsHelpers';
import {
  hasDietArchiveFieldsChanged,
  hasInUseDietPatientRule,
  hasMealRefreshRemainCount,
  loadAiMakeOneDayMealRemainCount,
  MEAL_REFRESH_BY_ARCHIVE_MESSAGE,
  MEAL_REFRESH_BY_ARCHIVE_TITLE,
  pickDietArchiveRelatedFields,
  type DietArchiveRelatedFields,
} from '@/src/features/profile/healthRecord/utils/profileDietArchiveRefreshHelpers';
import { postRefreshMealDayByArchive } from '@/api/dietPatientRule';

const PROFILE_EDIT_ACCESSORY = {
  name: 'profileEditNameDoneToolbar',
  height: 'profileEditHeightDoneToolbar',
  weight: 'profileEditWeightDoneToolbar',
  primaryDiagnosis: 'profileEditPrimaryDiagnosisDoneToolbar',
  diagnosticLabel: 'profileEditDiagnosticLabelDoneToolbar',
  primaryHealthGoal: 'profileEditPrimaryHealthGoalDoneToolbar',
  dietaryPreferences: 'profileEditDietaryPreferencesDoneToolbar',
} as const;

const BLOOD_TYPES = ['A型', 'B型', 'AB型', 'O型', '不详'] as const;
const BLOOD_TYPE_PICKER_DATA = BLOOD_TYPES.map(item => ({ label: item, value: item }));
const GENDERS = ['男', '女'] as const;
const NAME_MAX_LENGTH = 10;
const METRIC_MAX_LENGTH = 6;
const TEXT_AREA_MAX_LENGTH = 200;

function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function normalizeBirthDate(value?: string) {
  if (!value) {
    return '';
  }
  const m = moment(value, ['YYYY-MM-DD', 'YYYYMMDD'], true);
  return m.isValid() ? m.format('YYYY-MM-DD') : value;
}

function parseBirthDate(value?: string) {
  if (!value) {
    return undefined;
  }
  const m = moment(value, ['YYYY-MM-DD', 'YYYYMMDD'], true);
  return m.isValid() ? m.toDate() : undefined;
}

async function pickImageFromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('提示', '需要相册权限');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const name = asset.fileName ?? `avatar_${Date.now()}.jpg`;
  const type = asset.mimeType ?? 'image/jpeg';
  return { uri: asset.uri, name, type };
}

type ProfileEditForm = {
  avatarOssId?: string;
  name: string;
  gender: string;
  birthDate: string;
  height: string;
  weight: string;
  bloodType: string;
  dailyActivityLevel: string;
  primaryDiagnosis: string;
  diagnosticLabel: string;
  primaryHealthGoal: string;
  dietaryPreferences: string;
  fitnessLevel: string;
  trainingGoals: string[];
};

const EMPTY_FORM: ProfileEditForm = {
  avatarOssId: undefined,
  name: '',
  gender: '',
  birthDate: '',
  height: '',
  weight: '',
  bloodType: '',
  dailyActivityLevel: '',
  primaryDiagnosis: '',
  diagnosticLabel: '',
  primaryHealthGoal: '',
  dietaryPreferences: '',
  fitnessLevel: '',
  trainingGoals: [],
};

export default function ProfileEditPage() {
  const dispatch = useDispatch<AppDispatch>();
  const systemUser = useSelector((state: RootState) => state.user.systemUser);
  const [avatarOssUrl, setAvatarOssUrl] = useState('');
  const [form, setForm] = useState<ProfileEditForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fitnessLevelPickerData, setFitnessLevelPickerData] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [trainingGoalOptions, setTrainingGoalOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const initialWeightRef = useRef<number | null>(null);
  const initialDietFieldsRef = useRef<DietArchiveRelatedFields>(
    pickDietArchiveRelatedFields(EMPTY_FORM),
  );
  const mealRefreshRemainCountRef = useRef<number | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [res, fitnessItems, trainingItems, remainCount] = await Promise.all([
          getUserBaseInfo(),
          loadFitnessLevelDictItems(),
          loadTrainingGoalDictItems(),
          loadAiMakeOneDayMealRemainCount(),
        ]);
        mealRefreshRemainCountRef.current = remainCount;
        setFitnessLevelPickerData(buildFitnessLevelPickerData(fitnessItems));
        setTrainingGoalOptions(buildTrainingGoalOptions(trainingItems));

        const data = apiResourceData<UserBaseInfo>(
          res as { code?: number; data?: UserBaseInfo },
        );
        if (data) {
          const loadedWeight = data.weight != null && Number.isFinite(Number(data.weight))
            ? Number(data.weight)
            : null;
          initialWeightRef.current = loadedWeight;
          setAvatarOssUrl(data.avatarOssUrl ?? '');
          setForm({
            avatarOssId: data.avatarOssId != null ? String(data.avatarOssId) : undefined,
            name: limitText(data.name ?? '', NAME_MAX_LENGTH),
            gender: data.gender ?? '',
            birthDate: normalizeBirthDate(data.birthDate),
            height: limitText(data.height != null ? String(data.height) : '', METRIC_MAX_LENGTH),
            weight: limitText(loadedWeight != null ? String(loadedWeight) : '', METRIC_MAX_LENGTH),
            bloodType: data.bloodType ?? '',
            dailyActivityLevel: data.dailyActivityLevel != null ? String(data.dailyActivityLevel) : '',
            primaryDiagnosis: data.primaryDiagnosis ?? '',
            diagnosticLabel: data.diagnosticLabel ?? '',
            primaryHealthGoal: data.primaryHealthGoal ?? '',
            dietaryPreferences: data.dietaryPreferences ?? '',
            fitnessLevel: data.fitnessLevel != null ? String(data.fitnessLevel) : '',
            trainingGoals: normalizeTrainingGoals(data.trainingGoals),
          });
          initialDietFieldsRef.current = pickDietArchiveRelatedFields({
            primaryDiagnosis: data.primaryDiagnosis,
            diagnosticLabel: data.diagnosticLabel,
            primaryHealthGoal: data.primaryHealthGoal,
            dietaryPreferences: data.dietaryPreferences,
          });
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const patch = <K extends keyof ProfileEditForm>(key: K, value: ProfileEditForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleTrainingGoal = useCallback((value: string) => {
    setForm(prev => {
      const exists = prev.trainingGoals.includes(value);
      return {
        ...prev,
        trainingGoals: exists
          ? prev.trainingGoals.filter(item => item !== value)
          : [...prev.trainingGoals, value],
      };
    });
  }, []);

  const pickAvatar = async () => {
    if (uploadingAvatar) {
      return;
    }

    const file = await pickImageFromLibrary();
    if (!file) {
      return;
    }

    const previousUrl = avatarOssUrl;
    const previousOssId = form.avatarOssId;
    setAvatarOssUrl(file.uri);
    setUploadingAvatar(true);
    const loadingKey = Toast.loading('上传中', 0);
    try {
      const res = await uploadOss(file);
      const data = apiResourceData<{ url?: string; ossId?: string | number }>(
        res as { code?: number; data?: { url?: string; ossId?: string | number } },
      );
      if (data?.url) {
        setAvatarOssUrl(data.url);
        patch('avatarOssId', data.ossId != null ? String(data.ossId) : undefined);
      } else {
        setAvatarOssUrl(previousUrl);
        patch('avatarOssId', previousOssId);
        const r = res as { msg?: string; message?: string };
        Alert.alert('上传失败', r.msg ?? r.message ?? '请稍后重试');
      }
    } catch {
      setAvatarOssUrl(previousUrl);
      patch('avatarOssId', previousOssId);
      Alert.alert('错误', '上传失败，请稍后重试');
    } finally {
      Toast.remove(loadingKey);
      setUploadingAvatar(false);
    }
  };

  const requestRefreshMealDayByArchive = useCallback(() => {
    Alert.alert(MEAL_REFRESH_BY_ARCHIVE_TITLE, MEAL_REFRESH_BY_ARCHIVE_MESSAGE, [
      { text: '暂不更新', style: 'cancel' },
      {
        text: '立即更新',
        onPress: () => {
          void (async () => {
            const loadingKey = Toast.loading('提交中…', 0);
            try {
              const res = await postRefreshMealDayByArchive();
              if (!isResourceApiOk(res as { code?: number })) {
                const r = res as { msg?: string; message?: string };
                Toast.show(r.msg ?? r.message ?? '提交失败');
                return;
              }
              Toast.info('食谱更新中，完成后将自动刷新');
            } catch {
              Toast.show('网络错误，请稍后重试');
            } finally {
              Toast.remove(loadingKey);
            }
          })();
        },
      },
    ]);
  }, []);

  const save = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (!form.gender.trim() || !(GENDERS as readonly string[]).includes(form.gender)) {
      Alert.alert('提示', '请选择性别');
      return;
    }
    if (!form.birthDate.trim()) {
      Alert.alert('提示', '请选择出生日期');
      return;
    }
    if (!form.height.trim()) {
      Alert.alert('提示', '请输入身高');
      return;
    }
    if (!form.weight.trim()) {
      Alert.alert('提示', '请输入体重');
      return;
    }
    if (!form.bloodType.trim()) {
      Alert.alert('提示', '请选择血型');
      return;
    }
    if (!form.dailyActivityLevel.trim()) {
      Alert.alert('提示', '请选择活动水平');
      return;
    }

    const height = Number(form.height);
    const weight = Number(form.weight);
    if (!Number.isFinite(height) || height <= 0) {
      Alert.alert('提示', '请输入有效身高');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      Alert.alert('提示', '请输入有效体重');
      return;
    }

    const nextDietFields = pickDietArchiveRelatedFields(form);
    const dietFieldsChanged = hasDietArchiveFieldsChanged(
      initialDietFieldsRef.current,
      nextDietFields,
    );

    setLoading(true);
    try {
      const res = await updateUserBaseInfo({
        avatarOssId: form.avatarOssId,
        name: form.name.trim(),
        gender: form.gender,
        birthDate: form.birthDate || undefined,
        height,
        weight,
        bloodType: form.bloodType || undefined,
        dailyActivityLevel: form.dailyActivityLevel || undefined,
        primaryDiagnosis: form.primaryDiagnosis.trim() || undefined,
        diagnosticLabel: form.diagnosticLabel.trim() || undefined,
        primaryHealthGoal: form.primaryHealthGoal.trim() || undefined,
        dietaryPreferences: form.dietaryPreferences.trim() || undefined,
        fitnessLevel: form.fitnessLevel || undefined,
        trainingGoals: form.trainingGoals,
      });
      if (!isResourceApiOk(res as { code?: number })) {
        const r = res as { msg?: string; message?: string };
        Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
        return;
      }

      if (!isSameWeight(initialWeightRef.current, weight)) {
        try {
          await syncProfileWeightToMeasureData(weight);
        } catch (error) {
          console.error('syncProfileWeightToMeasureData failed:', error);
        }
        initialWeightRef.current = weight;
      }

      await dispatch(fetchUserBaseInfo({ force: true }));
      initialDietFieldsRef.current = nextDietFields;

      const canAskMealRefresh =
        dietFieldsChanged
        && hasMealRefreshRemainCount(mealRefreshRemainCountRef.current)
        && (await hasInUseDietPatientRule());

      if (canAskMealRefresh) {
        requestRefreshMealDayByArchive();
      } else {
        Toast.show('资料已保存');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dispatch, form, requestRefreshMealDayByArchive]);

  if (initializing) {
    return (
      <PageLayout style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  const defaultAvatar = getDefaultAvatarByGender(form.gender);

  return (
    <PageLayout style={styles.container} edges={[]}>
      {Object.values(PROFILE_EDIT_ACCESSORY).map(id => (
        <KeyboardDoneAccessory key={id} nativeID={id} />
      ))}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.userBox}>
            <Flex direction="column" justify="center" align="center" style={styles.userInfoBox}>
              <TouchableOpacity activeOpacity={0.8} onPress={pickAvatar} disabled={uploadingAvatar}>
                <View>
                  {avatarOssUrl ? (
                    <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
                  ) : (
                    <Image source={defaultAvatar} style={styles.avatarImg} />
                  )}
                  {uploadingAvatar ? (
                    <View style={styles.avatarLoading}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
              <Text style={styles.tipText}>点击更换头像</Text>
            </Flex>
            <Flex justify="between" align="center" style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>姓名</Text>
              <TextInput
                style={styles.infoInput}
                value={form.name}
                onChangeText={t => patch('name', limitText(t, NAME_MAX_LENGTH))}
                placeholder="请输入姓名"
                placeholderTextColor={AppTheme.textSecondary}
                maxLength={NAME_MAX_LENGTH}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.name}
              />
            </Flex>

            <Flex justify="between" align="center" style={styles.fieldBlock}>
              <Text style={styles.infoItemLabel}>性别</Text>
              <Flex align="center" style={styles.genderSelectRow}>
                {GENDERS.map(item => {
                  const selected = form.gender === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.7}
                      style={styles.genderSelectItem}
                      onPress={() => patch('gender', item)}
                    >
                      {selected ? (
                        <Image
                          style={styles.genderSelectIcon}
                          source={require('@/assets/images/user/select.png')}
                        />
                      ) : (
                        <View style={styles.genderSelectBox} />
                      )}
                      <Text style={styles.genderSelectText}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </Flex>
            </Flex>

            <DatePicker
              precision="day"
              minDate={new Date(1900, 0, 1)}
              maxDate={new Date()}
              value={parseBirthDate(form.birthDate)}
              onOk={date => patch('birthDate', moment(date).format('YYYY-MM-DD'))}>
              <TouchableOpacity activeOpacity={0.7}>
                <Flex justify="between" align="center" style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>出生日期</Text>
                  <Flex justify="end" align="center" style={{ flex: 1 }}>
                    <Text style={[styles.infoItemValue, !form.birthDate && styles.infoPlaceholder]}>
                      {form.birthDate || '请选择出生日期'}
                    </Text>
                    <Image source={require('@/assets/images/user/icon_right.png')} style={styles.arrowRight} />
                  </Flex>
                </Flex>
              </TouchableOpacity>
            </DatePicker>

            <Flex justify="between" align="center" style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>身高</Text>
              <TextInput
                style={styles.infoInput}
                value={form.height}
                onChangeText={t => patch('height', limitText(t, METRIC_MAX_LENGTH))}
                placeholder="请输入身高（必填）"
                placeholderTextColor={AppTheme.textSecondary}
                keyboardType="decimal-pad"
                maxLength={METRIC_MAX_LENGTH}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.height}
              />
              <Text style={styles.unitText}>cm</Text>
            </Flex>

            <Flex justify="between" align="center" style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>体重</Text>
              <TextInput
                style={styles.infoInput}
                value={form.weight}
                onChangeText={t => patch('weight', limitText(t, METRIC_MAX_LENGTH))}
                placeholder="请输入体重（必填）"
                placeholderTextColor={AppTheme.textSecondary}
                keyboardType="decimal-pad"
                maxLength={METRIC_MAX_LENGTH}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.weight}
              />
              <Text style={styles.unitText}>kg</Text>
            </Flex>

            <Picker
              data={BLOOD_TYPE_PICKER_DATA}
              cols={1}
              value={form.bloodType ? [form.bloodType] : []}
              onOk={values => patch('bloodType', String(values[0] ?? ''))}>
              <TouchableOpacity activeOpacity={0.7}>
                <Flex justify="between" align="center" style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>血型</Text>
                  <Flex justify="end" align="center" style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.infoItemValue,
                        !form.bloodType && styles.infoPlaceholder,
                      ]}
                      numberOfLines={1}>
                      {form.bloodType || '请选择血型'}
                    </Text>
                    <Image
                      source={require('@/assets/images/vitals/icon_right.png')}
                      style={{ width: 5, height: 9, marginLeft: 6 }}
                    />
                  </Flex>
                </Flex>
              </TouchableOpacity>
            </Picker>

            <Picker
              data={DAILY_ACTIVITY_LEVEL_PICKER_DATA}
              cols={1}
              value={form.dailyActivityLevel ? [form.dailyActivityLevel] : []}
              onOk={values => patch('dailyActivityLevel', String(values[0] ?? ''))}>
              <TouchableOpacity activeOpacity={0.7}>
                <Flex justify="between" align="center" style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>活动水平</Text>
                  <Flex justify="end" align="center" style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.infoItemValue,
                        !form.dailyActivityLevel && styles.infoPlaceholder,
                      ]}
                      numberOfLines={1}>
                      {resolveDailyActivityLevelLabel(form.dailyActivityLevel) || '请选择运动水平'}
                    </Text>
                    <Image
                      source={require('@/assets/images/vitals/icon_right.png')}
                      style={{ width: 5, height: 9, marginLeft: 6 }}
                    />
                  </Flex>
                </Flex>
              </TouchableOpacity>
            </Picker>

            <Flex justify="between" align="center" style={[styles.infoItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoItemLabel}>手机号</Text>
              <Text style={styles.infoItemValue}>{maskPhoneNumber(systemUser?.phonenumber)}</Text>
            </Flex>
          </View>

          <View style={[styles.userBox, { marginTop: 12 }]}>
            <View style={[styles.fieldMultilineBlock, styles.fieldMultilineBlockFirst]}>
              <Text style={styles.infoItemLabel}>主诉</Text>
              <TextInput
                style={styles.fieldMultilineInput}
                value={form.primaryDiagnosis}
                onChangeText={t => patch('primaryDiagnosis', limitText(t, TEXT_AREA_MAX_LENGTH))}
                placeholder="如当前有无慢性疾病、受伤情况等"
                placeholderTextColor={AppTheme.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={TEXT_AREA_MAX_LENGTH}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.primaryDiagnosis}
              />
            </View>

            <View style={styles.fieldMultilineBlock}>
              <Text style={styles.infoItemLabel}>健康标签</Text>
              <TextInput
                style={styles.fieldMultilineInput}
                value={form.diagnosticLabel}
                onChangeText={t => patch('diagnosticLabel', limitText(t, TEXT_AREA_MAX_LENGTH))}
                placeholder="如高血压、肥胖等，用逗号分隔"
                placeholderTextColor={AppTheme.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={TEXT_AREA_MAX_LENGTH}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.diagnosticLabel}
              />
            </View>

            <View style={styles.fieldMultilineBlock}>
              <Text style={styles.infoItemLabel}>主要健康目标</Text>
              <TextInput
                style={styles.fieldMultilineInput}
                value={form.primaryHealthGoal}
                onChangeText={t => patch('primaryHealthGoal', limitText(t, TEXT_AREA_MAX_LENGTH))}
                placeholder="如控制血压、减脂增肌等"
                placeholderTextColor={AppTheme.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={TEXT_AREA_MAX_LENGTH}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.primaryHealthGoal}
              />
            </View>

            <View style={styles.fieldMultilineBlock}>
              <Text style={styles.infoItemLabel}>饮食偏好</Text>
              <TextInput
                style={styles.fieldMultilineInput}
                value={form.dietaryPreferences}
                onChangeText={t => patch('dietaryPreferences', limitText(t, TEXT_AREA_MAX_LENGTH))}
                placeholder="如素食、回民、不吃辣、不吃海鲜等"
                placeholderTextColor={AppTheme.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={TEXT_AREA_MAX_LENGTH}
                inputAccessoryViewID={PROFILE_EDIT_ACCESSORY.dietaryPreferences}
              />
            </View>

            <View style={styles.fieldMultilineBlock}>
              <Text style={styles.infoItemLabel}>体能水平</Text>
              <View style={styles.optionChipList}>
                {fitnessLevelPickerData.map(item => {
                  const selected = form.fitnessLevel === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.7}
                      style={[
                        styles.fitnessLevelChip,
                        selected && styles.fitnessLevelChipActive,
                      ]}
                      onPress={() => patch('fitnessLevel', item.value)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selected && styles.optionChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.fieldMultilineBlock, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoItemLabel}>训练目标（多选）</Text>
              <View style={styles.wrapChipGrid}>
                {trainingGoalOptions.map(item => {
                  const selected = form.trainingGoals.includes(item.value);
                  return (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.7}
                      style={[
                        styles.trainingGoalChip,
                        selected && styles.trainingGoalChipActive,
                      ]}
                      onPress={() => toggleTrainingGoal(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selected && styles.optionChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
          <Text style={styles.tipTextSecond}>
            * 请尽量准确填写档案信息，方便系统为您精准定制健康方案
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>

      {keyboardHeight <= 0 ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomBarButton, loading && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={save}
            disabled={loading}
          >
            <Flex style={{ flex: 1 }} justify="center" align="center">
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Image
                    style={styles.bottomBarButtonImg}
                    source={require('@/assets/images/schedule/save.png')}
                  />
                  <Text style={styles.bottomBarButtonText}>保存</Text>
                </>
              )}
            </Flex>
          </TouchableOpacity>
        </View>
      ) : null}
    </PageLayout>
  );
}

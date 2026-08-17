import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { DatePicker, Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { uploadOss } from '@/api/oss';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserBaseInfo } from '@/store/actions/user';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import {
  emptyFamilyMemberProfileForm,
  loadFamilyMemberProfileForm,
  parseBirthDate,
  saveFamilyMemberProfileForm,
  type FamilyMemberProfileForm,
} from './utils/familyMemberProfileHelpers';

const GENDERS = ['男', '女'] as const;
const NAME_MAX_LENGTH = 10;
const NAME_ACCESSORY_ID = 'familyMemberProfileNameDoneToolbar';

function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
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

export default function FamilyMemberProfilePage() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const phone = systemUser?.phonenumber;

  const [form, setForm] = useState<FamilyMemberProfileForm>(
    emptyFamilyMemberProfileForm(phone),
  );
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const patch = useCallback(<K extends keyof FamilyMemberProfileForm>(
    key: K,
    value: FamilyMemberProfileForm[K],
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadProfile = useCallback(async () => {
    setInitializing(true);
    try {
      const data = await loadFamilyMemberProfileForm(phone);
      setForm(data);
    } catch {
      setForm(emptyFamilyMemberProfileForm(phone));
    } finally {
      setInitializing(false);
    }
  }, [phone]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const pickAvatar = async () => {
    const file = await pickImageFromLibrary();
    if (!file) return;

    const previousUrl = form.avatarOssUrl;
    const previousOssId = form.avatarOssId;
    patch('avatarOssUrl', file.uri);
    setUploadingAvatar(true);
    const loadingKey = Toast.loading('上传中', 0);
    try {
      const res = await uploadOss(file);
      const data = apiResourceData<{ url?: string; ossId?: string | number }>(
        res as { code?: number; data?: { url?: string; ossId?: string | number } },
      );
      if (data?.url) {
        patch('avatarOssUrl', data.url);
        patch('avatarOssId', data.ossId != null ? String(data.ossId) : undefined);
      } else {
        patch('avatarOssUrl', previousUrl);
        patch('avatarOssId', previousOssId);
        const r = res as { msg?: string; message?: string };
        Alert.alert('上传失败', r.msg ?? r.message ?? '请稍后重试');
      }
    } catch {
      patch('avatarOssUrl', previousUrl);
      patch('avatarOssId', previousOssId);
      Alert.alert('错误', '上传失败，请稍后重试');
    } finally {
      Toast.remove(loadingKey);
      setUploadingAvatar(false);
    }
  };

  const save = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (
      !form.gender.trim() ||
      !(GENDERS as readonly string[]).includes(form.gender as (typeof GENDERS)[number])
    ) {
      Alert.alert('提示', '请选择性别');
      return;
    }

    setSaving(true);
    try {
      const result = await saveFamilyMemberProfileForm(form);
      if (!result.ok) {
        Alert.alert('失败', result.msg ?? '请稍后重试');
        return;
      }
      await dispatch(fetchUserBaseInfo({ force: true }));
      Toast.show('资料已保存');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [dispatch, form, navigation]);

  if (initializing) {
    return (
      <PageLayout style={styles.container}>
        <Flex justify="center" style={{ flex: 1 }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </Flex>
      </PageLayout>
    );
  }

  const defaultAvatar = getDefaultAvatarByGender(form.gender);

  return (
    <PageLayout style={styles.container} edges={[]}>
      <KeyboardDoneAccessory nativeID={NAME_ACCESSORY_ID} />
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[styles.body, { paddingBottom: 24 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.userBox}>
              <Flex direction="column" justify="center" align="center" style={styles.userInfoBox}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => void pickAvatar()}
                  disabled={uploadingAvatar}
                >
                  <View>
                    {form.avatarOssUrl ? (
                      <Image source={{ uri: form.avatarOssUrl }} style={styles.avatarImg} />
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
                  inputAccessoryViewID={NAME_ACCESSORY_ID}
                />
              </Flex>

              <Flex justify="between" align="center" style={styles.fieldBlock}>
                <Text style={styles.infoItemLabel}>性别</Text>
                <View style={[styles.chipGrid, { gap: 8 }]}>
                  {GENDERS.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.choiceChip,
                        styles.choiceChipInline,
                        form.gender === item && styles.choiceChipActive,
                      ]}
                      onPress={() => patch('gender', item)}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          form.gender === item && styles.choiceChipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Flex>

              <DatePicker
                precision="day"
                minDate={new Date(1900, 0, 1)}
                maxDate={new Date()}
                value={parseBirthDate(form.birthDate)}
                onOk={date => patch('birthDate', moment(date).format('YYYY-MM-DD'))}
              >
                <TouchableOpacity activeOpacity={0.7}>
                  <Flex justify="between" align="center" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>出生日期</Text>
                    <Flex justify="end" align="center" style={{ flex: 1 }}>
                      <Text
                        style={[styles.infoItemValue, !form.birthDate && styles.infoPlaceholder]}
                      >
                        {form.birthDate || '请选择出生日期'}
                      </Text>
                      <Image
                        tintColor={AppTheme.primaryColor}
                        source={require('@/assets/images/user/icon-rl.png')}
                        style={styles.arrowRight}
                      />
                    </Flex>
                  </Flex>
                </TouchableOpacity>
              </DatePicker>

              <Flex
                justify="between"
                align="center"
                style={[styles.infoItem, { borderBottomWidth: 0 }]}
              >
                <Text style={styles.infoItemLabel}>手机号</Text>
                <Text style={styles.infoItemValue}>{form.phone}</Text>
              </Flex>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.bottomBarButtonLeft}
            disabled={saving}
            onPress={() => void save()}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.bottomBarButtonTextLeft}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </PageLayout>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Flex, DatePicker, Toast } from '@ant-design/react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { getUserBaseInfo, updateUserBaseInfo } from '@/api/patient';
import { uploadOss } from '@/api/oss';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import allergyStyles from '@/css/profile/allergies';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { fetchUserBaseInfo } from '@/store/actions/user';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';

const BLOOD_TYPES = ['A型', 'B型', 'AB型', 'O型', '不详'] as const;
const GENDERS = ['男', '女'] as const;

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

export default function ProfileEditPage() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [avatarOssUrl, setAvatarOssUrl] = useState('');
  const [form, setForm] = useState({
    avatarOssId: undefined as string | undefined,
    name: '',
    gender: '',
    birthDate: '',
    height: '',
    weight: '',
    bloodType: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserBaseInfo();
        const data = apiResourceData<{
          avatarOssId?: string;
          avatarOssUrl?: string;
          name?: string;
          gender?: string;
          birthDate?: string;
          height?: number;
          weight?: number;
          bloodType?: string;
        }>(res as { code?: number; data?: Record<string, unknown> });
        if (data) {
          setAvatarOssUrl(data.avatarOssUrl ?? '');
          setForm({
            avatarOssId: data.avatarOssId != null ? String(data.avatarOssId) : undefined,
            name: data.name ?? '',
            gender: data.gender ?? '',
            birthDate: normalizeBirthDate(data.birthDate),
            height: data.height != null ? String(data.height) : '',
            weight: data.weight != null ? String(data.weight) : '',
            bloodType: data.bloodType ?? '',
          });
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const patch = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

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

  const save = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }

    setLoading(true);
    try {
      const height = form.height.trim() ? Number(form.height) : undefined;
      const weight = form.weight.trim() ? Number(form.weight) : undefined;
      const res = await updateUserBaseInfo({
        avatarOssId: form.avatarOssId,
        name: form.name.trim(),
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        height: Number.isFinite(height) ? height : undefined,
        weight: Number.isFinite(weight) ? weight : undefined,
        bloodType: form.bloodType || undefined,
      });
      if (isResourceApiOk(res as { code?: number })) {
        await dispatch(fetchUserBaseInfo());
        Alert.alert('成功', '资料已保存', [{ text: '确定', onPress: () => navigation.goBack() }]);
      } else {
        const r = res as { msg?: string; message?: string };
        Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dispatch, form, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={save} disabled={loading || initializing} style={{ marginRight: 16 }}>
          {loading ? (
            <ActivityIndicator size="small" color={AppTheme.primaryColor} />
          ) : (
            <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>保存</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, save, loading, initializing]);

  if (initializing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = form.name.trim() || 'U';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TouchableOpacity activeOpacity={0.8} onPress={pickAvatar} disabled={uploadingAvatar}>
          <Flex direction="column" justify="center" align="center" style={{ marginTop: 16 }}>
            <View>
              {avatarOssUrl ? (
                <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayName[0] ?? 'U'}</Text>
                </View>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <Text style={styles.tipText}>点击更换头像</Text>
          </Flex>
        </TouchableOpacity>

        <Flex justify='between' style={[styles.sectionBox, { marginTop: 23 }]}>
          <Text style={styles.sectionTitle}>个人信息</Text>
        </Flex>

        <View style={styles.infoBox}>
          <Flex justify="between" align="center" style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>姓名</Text>
            <TextInput
              style={styles.infoInput}
              value={form.name}
              onChangeText={t => patch('name', t)}
              placeholder="请输入姓名"
              placeholderTextColor={AppTheme.textSecondary}
            />
          </Flex>

          <View style={styles.fieldBlock}>
            <Text style={styles.infoItemLabel}>性别</Text>
            <View style={[allergyStyles.chipGrid, styles.chipRow]}>
              {GENDERS.map(item => (
                <TouchableOpacity
                  key={item}
                  style={[allergyStyles.yzBox, form.gender === item && allergyStyles.yzBoxActive]}
                  onPress={() => patch('gender', item)}>
                  <Flex style={{ flex: 1 }}>
                    <Text
                      style={[
                        allergyStyles.yzText,
                        form.gender === item && allergyStyles.yzTextActive,
                      ]}>
                      {item}
                    </Text>
                  </Flex>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <DatePicker
            precision="day"
            minDate={new Date(1900, 0, 1)}
            maxDate={new Date()}
            value={parseBirthDate(form.birthDate)}
            onOk={date => patch('birthDate', moment(date).format('YYYY-MM-DD'))}>
            <TouchableOpacity activeOpacity={0.7}>
              <Flex justify="between" align="center" style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>出生日期</Text>
                <Flex>
                  <Text style={[styles.infoItemValue, !form.birthDate && styles.infoPlaceholder]}>
                    {form.birthDate || '请选择出生日期'}
                  </Text>

                  <Image source={require('@/assets/images/user/icon-rl.png')} style={styles.arrowRight} />
                </Flex>
              </Flex>
            </TouchableOpacity>
          </DatePicker>

          <Flex justify="between" align="center" style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>身高</Text>
            <TextInput
              style={styles.infoInput}
              value={form.height}
              onChangeText={t => patch('height', t)}
              placeholder="请输入身高"
              placeholderTextColor={AppTheme.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitText}>cm</Text>
          </Flex>

          <Flex justify="between" align="center" style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>体重</Text>
            <TextInput
              style={styles.infoInput}
              value={form.weight}
              onChangeText={t => patch('weight', t)}
              placeholder="请输入体重"
              placeholderTextColor={AppTheme.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitText}>kg</Text>
          </Flex>

          <View style={[styles.fieldBlock, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoItemLabel}>血型</Text>
            <View style={allergyStyles.chipGrid}>
              {BLOOD_TYPES.map((item, index) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    allergyStyles.yzBox,
                    allergyStyles.chipItem,
                    index % 3 === 2 && allergyStyles.chipItemLastInRow,
                    form.bloodType === item && allergyStyles.yzBoxActive,
                  ]}
                  onPress={() => patch('bloodType', item)}>
                  <Text
                    style={[
                      allergyStyles.yzText,
                      form.bloodType === item && allergyStyles.yzTextActive,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

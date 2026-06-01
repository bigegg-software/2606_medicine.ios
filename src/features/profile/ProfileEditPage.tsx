import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserBaseInfo, updateUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/profileEdit';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

const BLOOD_TYPES = ['A型', 'B型', 'AB型', 'O型', '不详'];
const GENDERS = ['男', '女'];

export default function ProfileEditPage() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    avatarOssId: undefined as number | undefined,
    name: '',
    gender: '',
    birthDate: '',
    height: '',
    weight: '',
    bloodType: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getUserBaseInfo();
      if (isResourceApiOk(res as { code?: number })) {
        const d = (res as { data?: UserBaseInfo }).data ?? {};
        setForm({
          avatarOssId: d.avatarOssId,
          name: d.name ?? '',
          gender: d.gender ?? '',
          birthDate: d.birthDate ?? '',
          height: d.height != null ? String(d.height) : '',
          weight: d.weight != null ? String(d.weight) : '',
          bloodType: d.bloodType ?? '',
        });
      }
    })();
  }, []);

  const patch = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    setLoading(true);
    try {
      const height = form.height.trim() ? Number(form.height) : undefined;
      const weight = form.weight.trim() ? Number(form.weight) : undefined;
      const payload = {
        avatarOssId: form.avatarOssId,
        name: form.name.trim(),
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        height: Number.isFinite(height) ? height : undefined,
        weight: Number.isFinite(weight) ? weight : undefined,
        bloodType: form.bloodType || undefined,
      };
      const res = await updateUserBaseInfo(payload);
      if (isResourceApiOk(res as { code?: number; msg?: string })) {
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>编辑资料</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="姓名" value={form.name} onChangeText={t => patch('name', t)} placeholder="请输入姓名" />
        <Text style={styles.label}>性别</Text>
        <View style={styles.chipRow}>
          {GENDERS.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, form.gender === g && styles.chipActive]}
              onPress={() => patch('gender', g)}>
              <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field
          label="出生日期"
          value={form.birthDate ?? ''}
          onChangeText={t => patch('birthDate', t)}
          placeholder="yyyy-MM-dd"
        />
        <Field
          label="身高 (cm)"
          value={form.height}
          onChangeText={t => patch('height', t)}
          placeholder="请输入身高"
          keyboardType="decimal-pad"
        />
        <Field
          label="体重 (kg)"
          value={form.weight}
          onChangeText={t => patch('weight', t)}
          placeholder="请输入体重"
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>血型</Text>
        <View style={styles.chipRow}>
          {BLOOD_TYPES.map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.chip, form.bloodType === b && styles.chipActive]}
              onPress={() => patch('bloodType', b)}>
              <Text style={[styles.chipText, form.bloodType === b && styles.chipTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={save} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppTheme.hintTextColor}
        keyboardType={keyboardType}
      />
    </>
  );
}

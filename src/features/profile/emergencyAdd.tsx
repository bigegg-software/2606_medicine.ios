import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Flex, Switch } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  addEmergencyContact,
  getEmergencyContactInfo,
  updateEmergencyContact,
  type EmergencyContact,
} from '@/api/emergencyContact';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergies';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import type { DictDataItem } from '@/api/dict';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyAdd'>;

const CONTACT_NAME_MAX_LENGTH = 20;
const CONTACT_PHONE_MAX_LENGTH = 20;
const REMARK_MAX_LENGTH = 100;

function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export default function EmergencyAddPage({ route }: Props) {
  const contactId = route.params?.id;
  const isEdit = contactId != null;
  const navigation = useNavigation<Nav>();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relationType, setRelationType] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [remark, setRemark] = useState('');
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(isEdit);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? '编辑紧急联系人' : '添加紧急联系人' });
  }, [isEdit, navigation]);

  useEffect(() => {
    (async () => {
      try {
        const options = await loadRelationTypeOptions();
        setRelationOptions(options);
        if (!isEdit && options.length > 0 && options[0].dictValue) {
          setRelationType(String(options[0].dictValue));
        }
      } catch {
        setRelationOptions([]);
      }
    })();
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || contactId == null) {
      return;
    }
    (async () => {
      try {
        const res = await getEmergencyContactInfo(contactId);
        const data = apiResourceData<EmergencyContact>(
          res as { code?: number; data?: EmergencyContact },
        );
        if (!data) {
          Alert.alert('错误', '加载联系人失败');
          return;
        }
        setContactName(data.contactName ?? '');
        setContactPhone(data.contactPhone ?? '');
        setRelationType(data.relationType ?? '');
        setIsDefault(data.isDefault === 1);
        setRemark(data.remark ?? '');
      } catch {
        Alert.alert('错误', '加载联系人失败');
      } finally {
        setInitializing(false);
      }
    })();
  }, [contactId, isEdit]);

  const submit = async () => {
    const name = contactName.trim();
    const phone = contactPhone.trim();

    if (!name) {
      Alert.alert('提示', '请输入联系人姓名');
      return;
    }
    if (!phone) {
      Alert.alert('提示', '请输入联系人电话');
      return;
    }
    if (!relationType) {
      Alert.alert('提示', '请选择联系人关系');
      return;
    }

    const payload = {
      contactName: name,
      contactPhone: phone,
      relationType,
      isDefault: isDefault ? 1 : 0,
      remark: remark.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const res = isEdit
        ? await updateEmergencyContact({ ...payload, id: contactId! })
        : await addEmergencyContact(payload);
      if (isResourceApiOk(res as { code?: number })) {
        navigation.goBack();
        return;
      }
      const r = res as { msg?: string; message?: string };
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.rowBox}>
          <Text style={styles.rowTitle}>联系人姓名</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="请输入姓名"
            placeholderTextColor={AppTheme.textSecondary}
            value={contactName}
            onChangeText={value => setContactName(limitText(value, CONTACT_NAME_MAX_LENGTH))}
            maxLength={CONTACT_NAME_MAX_LENGTH}
          />
          <View style={styles.rowLine} />

          <Text style={styles.rowTitle}>联系电话</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="请输入手机号"
            placeholderTextColor={AppTheme.textSecondary}
            value={contactPhone}
            onChangeText={value => setContactPhone(limitText(value, CONTACT_PHONE_MAX_LENGTH))}
            keyboardType="phone-pad"
            maxLength={CONTACT_PHONE_MAX_LENGTH}
          />
          <View style={styles.rowLine} />

          <Text style={styles.rowTitle}>联系人关系</Text>
          {relationOptions.length === 0 ? (
            <Text style={{ marginTop: 10, fontSize: 14, color: AppTheme.textSecondary }}>暂无关系选项</Text>
          ) : (
            <View style={[styles.chipGrid, { marginTop: 10 }]}>
              {relationOptions.map((item, index) => {
                const value = item.dictValue != null ? String(item.dictValue) : '';
                const active = relationType === value;
                const isLastInRow = (index + 1) % 3 === 0;
                return (
                  <TouchableOpacity
                    key={value || String(index)}
                    style={[
                      styles.yzBox,
                      styles.chipItem,
                      isLastInRow && styles.chipItemLastInRow,
                      active && styles.yzBoxActive,
                    ]}
                    onPress={() => setRelationType(value)}>
                    <Text style={[styles.yzText, active && styles.yzTextActive]}>
                      {item.dictLabel || value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={[styles.rowLine, { marginTop: 12 }]} />

          <Flex justify="between" align="center" style={{ marginBottom: 12 }}>
            <Text style={styles.rowTitle}>设为默认联系人</Text>
            <Switch style={styles.switch} checked={isDefault} onChange={setIsDefault} color={AppTheme.primaryColor} />
          </Flex>
          <View style={styles.rowLine} />

          <Text style={styles.rowTitle}>备注（选填）</Text>
          <TextInput
            style={[styles.inputBox, { height: 64, textAlignVertical: 'top' }]}
            placeholder="请输入备注"
            placeholderTextColor={AppTheme.textSecondary}
            value={remark}
            onChangeText={value => setRemark(limitText(value, REMARK_MAX_LENGTH))}
            multiline
            maxLength={REMARK_MAX_LENGTH}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting}>
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addText}>{isEdit ? '保存' : '添加'}</Text>
          )}
        </Flex>
      </TouchableOpacity>
    </PageLayout>
  );
}

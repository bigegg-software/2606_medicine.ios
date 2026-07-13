import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  addEmergencyContact,
  getEmergencyContactInfo,
  updateEmergencyContact,
  type EmergencyContact,
} from '@/api/emergencyContact';
import type { DictDataItem } from '@/api/dict';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';

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
  const [loadingOptions, setLoadingOptions] = useState(true);
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
      } catch {
        setRelationOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit || contactId == null) {
      return;
    }
    (async () => {
      try {
        const res = await getEmergencyContactInfo(contactId);
        const data = apiResourceData<EmergencyContact>(
          res as unknown as { code?: number; data?: EmergencyContact },
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

  if (initializing || loadingOptions) {
    return (
      <PageLayout style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container}>
      <KeyboardDoneAccessory />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.userBox}>
            <Flex justify="between" align="center" style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>姓名</Text>
              <TextInput
                style={styles.infoInput}
                placeholder="请输入姓名"
                placeholderTextColor={AppTheme.textSecondary}
                value={contactName}
                onChangeText={value => setContactName(limitText(value, CONTACT_NAME_MAX_LENGTH))}
                maxLength={CONTACT_NAME_MAX_LENGTH}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
            </Flex>

            <Flex justify="between" align="center" style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>手机号</Text>
              <TextInput
                style={styles.infoInput}
                placeholder="请输入手机号"
                placeholderTextColor={AppTheme.textSecondary}
                value={contactPhone}
                onChangeText={value => setContactPhone(limitText(value, CONTACT_PHONE_MAX_LENGTH))}
                keyboardType="phone-pad"
                maxLength={CONTACT_PHONE_MAX_LENGTH}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
            </Flex>

            <View style={styles.fieldBlock}>
              <Text style={styles.infoItemLabel}>关系</Text>
              <View style={styles.wrapChipGrid}>
                {relationOptions.map(item => {
                  const value = item.dictValue != null ? String(item.dictValue) : '';
                  const active = relationType === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.choiceChip,
                        styles.choiceChipInline,
                        styles.choiceChipWrap,
                        active && styles.choiceChipActive,
                      ]}
                      onPress={() => setRelationType(value)}>
                      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
                        {item.dictLabel || value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

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

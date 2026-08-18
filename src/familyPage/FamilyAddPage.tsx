import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Picker } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/profile/myFamilyAdd';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import type { DictDataItem } from '@/api/dict';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import { addFamilyBind } from '@/api/familyBind';
import { isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { getAllFamilyBindAuthPermissions, validateFamilyBindAddInput } from './utils/familyBindAddHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyAddPage() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const options = await loadRelationTypeOptions();
      setRelationOptions(options);
    })();
  }, []);

  const relationPickerData = useMemo(
    () =>
      relationOptions.map(item => ({
        label: item.dictLabel || String(item.dictValue ?? ''),
        value: String(item.dictValue ?? ''),
      })),
    [relationOptions],
  );

  const relationLabel =
    relationPickerData.find(item => item.value === relation)?.label || relation;

  const handleInvite = async () => {
    const error = validateFamilyBindAddInput({
      name,
      relation,
      phone,
    });
    if (error) {
      Alert.alert('提示', error);
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await addFamilyBind({
        remarkName: name.trim(),
        relationType: relation,
        phonenumber: phone.trim(),
        authPermissions: getAllFamilyBindAuthPermissions(),
      });
      if (isResourceApiOk(res as ApiResult)) {
        Alert.alert('成功', '邀请已发送，等待对方在消息中接受', [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]);
        return;
      }
      Alert.alert(
        '失败',
        (res as ApiResult)?.msg ?? (res as ApiResult)?.message ?? '请稍后重试',
      );
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout style={styles.container} edges={[]}>
      <KeyboardDoneAccessory />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.rowBox}>
            <Flex style={[styles.formRow, styles.formRowFirst]} align="center" justify="between">
              <Text style={styles.formLabel}>姓名</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入家人姓名"
                placeholderTextColor="#999999"
                value={name}
                onChangeText={setName}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
            </Flex>

            <Picker
              data={relationPickerData}
              cols={1}
              value={relation ? [relation] : []}
              onOk={values => setRelation(String(values[0] ?? ''))}
            >
              <Flex style={styles.formRow} align="center" justify="between">
                <Text style={styles.formLabel}>关系</Text>
                <Flex style={styles.formValueWrap} align="center">
                  <Text style={relation ? styles.formValue : styles.formPlaceholder}>
                    {relation ? relationLabel : '请选择关系'}
                  </Text>
                  <Image
                    style={styles.formArrow}
                    source={require('@/assets/images/family/icon_more.png')}
                  />
                </Flex>
              </Flex>
            </Picker>

            <Flex style={[styles.formRow, styles.formRowLast]} align="center" justify="between">
              <Text style={styles.formLabel}>手机号</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入手机号"
                placeholderTextColor="#999999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              />
            </Flex>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBarButtonLeft}
          activeOpacity={0.7}
          disabled={submitting}
          onPress={() => {
            void handleInvite();
          }}
        >
          <Flex style={{ flex: 1 }} justify="center" align="center">
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Image
                  style={styles.bottomBarButtonImg}
                  source={require('@/assets/images/family/send.png')}
                />
                <Text style={styles.bottomBarButtonTextLeft}>发送邀请</Text>
              </>
            )}
          </Flex>
        </TouchableOpacity>
      </View>
    </PageLayout>
  );
}

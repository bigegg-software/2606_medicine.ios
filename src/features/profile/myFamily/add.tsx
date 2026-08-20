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
import { inviteOldFamilyBind } from '@/api/oldFamilyBind';
import { isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
  FAMILY_PERMISSION_OPTIONS,
  areAllFamilyPermissionsSelected,
  toggleAllFamilyPermissions,
  toggleFamilyPermission,
  type FamilyPermissionKey,
} from './utils/myFamilyAddHelpers';
import {
  toFamilyPermissionApiCodes,
  validateFamilyInviteInput,
} from './utils/myFamilyListHelpers';

const ICON_SELECTED = '#6D925E';
const ICON_UNSELECTED = '#333333';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MyFamilyAddPage() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<FamilyPermissionKey[]>([]);
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

  const handleTogglePermission = (key: FamilyPermissionKey) => {
    setSelectedPermissions(prev => toggleFamilyPermission(prev, key));
  };

  const allPermissionsSelected = areAllFamilyPermissionsSelected(selectedPermissions);

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(prev => toggleAllFamilyPermissions(prev));
  };

  const handleInvite = async () => {
    const error = validateFamilyInviteInput({
      name,
      relation,
      phone,
      permissions: selectedPermissions,
    });
    if (error) {
      Alert.alert('提示', error);
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await inviteOldFamilyBind({
        childRemarkName: name.trim(),
        relationType: relation,
        phonenumber: phone.trim(),
        authPermissions: toFamilyPermissionApiCodes(selectedPermissions),
      });
      if (isResourceApiOk(res as ApiResult)) {
        Alert.alert('成功', '邀请已发送', [
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

          <View style={[styles.rowBox, { marginTop: 12 }]}>
            <Flex align="center" justify="between" style={styles.rowTitleRow}>
              <View>
                <Text style={styles.rowTitle}>授权权限（可多选）</Text>
                <Text style={styles.rowTitleDesc}>家人接受邀请后即可查看对应内容</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSelectAllPermissions}>
                <Text style={styles.rowTitleSelectAll}>
                  {allPermissionsSelected ? '取消全选' : '全选'}
                </Text>
              </TouchableOpacity>
            </Flex>

            <View style={styles.qxBox}>
              {FAMILY_PERMISSION_OPTIONS.map(item => {
                const active = selectedPermissions.includes(item.key);
                const iconColor = active ? ICON_SELECTED : ICON_UNSELECTED;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    onPress={() => handleTogglePermission(item.key)}
                    style={[styles.qxItem, active && styles.qxItemActive]}
                  >
                    <Flex style={styles.qxItemLeft} align="center">
                      <Image
                        style={styles.qxItemIcon}
                        source={item.icon}
                        tintColor={iconColor}
                      />
                      <Text
                        style={[styles.qxItemTitle, active && styles.qxItemTitleActive]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </Flex>
                    <Image
                      style={styles.qxCheckIcon}
                      source={
                        active
                          ? require('@/assets/images/schedule/wc.png')
                          : require('@/assets/images/schedule/select.png')
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
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

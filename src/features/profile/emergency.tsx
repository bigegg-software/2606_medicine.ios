import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  removeEmergencyContact,
  type EmergencyContact,
} from '@/api/emergencyContact';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
  formatEmergencyContactName,
  loadEmergencyContacts,
  loadRelationTypeLabelMap,
} from '@/src/features/profile/emergencyHelpers';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Emergency'>;

export default function EmergencyPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { readOnly, patientUserId } = resolveFamilyReadOnlyView(route.params);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [relationMap, setRelationMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const patientOpts = patientUserId ? { patientUserId } : undefined;
      const [list, relationLabels] = await Promise.all([
        loadEmergencyContacts({ pageNum: 1, pageSize: 50 }, patientOpts),
        loadRelationTypeLabelMap(),
      ]);
      setContacts(list);
      setRelationMap(relationLabels);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [patientUserId]);

  const loadRef = useRef(load);
  loadRef.current = load;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    loadRef.current();
  }, [patientUserId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      loadRef.current();
    }, []),
  );

  const handleDelete = (contact: EmergencyContact) => {
    if (contact.id == null) {
      return;
    }
    Alert.alert('删除联系人', `确定删除「${contact.contactName || '该联系人'}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await removeEmergencyContact(contact.id!);
            if (isResourceApiOk(res as { code?: number })) {
              setContacts(prev => prev.filter(item => item.id !== contact.id));
              return;
            }
            const r = res as { msg?: string; message?: string };
            Alert.alert('删除失败', r.msg ?? r.message ?? '请稍后重试');
          } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
          }
        },
      },
    ]);
  };

  const handleAdd = () => {
    navigation.navigate('EmergencyAdd');
  };

  const handleEdit = (contact: EmergencyContact) => {
    if (contact.id == null) {
      return;
    }
    navigation.navigate('EmergencyAdd', { id: contact.id });
  };

  if (loading) {
    return (
      <PageLayout style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={
          contacts.length === 0 ? styles.bodyEmpty : styles.body
        }>
        {contacts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Image
              style={styles.emptyImage}
              source={require('@/assets/images/user/zwjl.png')}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>暂无紧急联系人</Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.sectionTitle}>紧急联系人</Text>
              <View style={{ marginTop: 10 }}>
                {contacts.map((contact, index) => (
                  <Flex
                    key={String(contact.id)}
                    justify="between"
                    align="center"
                    style={[
                      styles.familyItem,
                      index === contacts.length - 1 && { marginBottom: 0 },
                    ]}>
                    <TouchableOpacity
                      style={{ flex: 1, minWidth: 0 }}
                      activeOpacity={readOnly ? 1 : 0.7}
                      disabled={readOnly}
                      onPress={() => handleEdit(contact)}>
                      <View style={styles.familyItemRow}>
                        <View style={styles.familyItemImgBox}>
                          <Image
                            style={styles.familyItemImg}
                            source={require('@/assets/images/user/icon_phone.png')}
                          />
                        </View>
                        <View style={styles.familyItemContent}>
                          <Flex align="center">
                            <Text style={styles.familyItemName} numberOfLines={1}>
                              {formatEmergencyContactName(contact, relationMap)}
                            </Text>
                            {contact.isDefault === 1 ? (
                              <Flex style={styles.jzBox}>
                                <Text style={styles.jzText}>默认</Text>
                              </Flex>
                            ) : null}
                          </Flex>
                          <Text style={styles.familyItemRelation} numberOfLines={1}>
                            {contact.contactPhone || '—'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {!readOnly ? (
                      <TouchableOpacity onPress={() => handleDelete(contact)}>
                        <Image style={styles.editIcon} source={require('@/assets/images/user/del.png')} />
                      </TouchableOpacity>
                    ) : null}
                  </Flex>
                ))}
              </View>
            </View>
            <Text style={styles.emergencyText}>
              紧急联系人将在您遇到紧急情况时被通知，建议添加2-3位家人或朋友。
            </Text>
          </>
        )}
      </ScrollView>

      {!readOnly ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBarButtonLeft}
            activeOpacity={0.7}
            onPress={handleAdd}>
            <Flex style={{ flex: 1 }}>
              <Image
                style={styles.bottomBarButtonImg}
                source={require('@/assets/images/vitals/icon_add.png')}
              />
              <Text style={styles.bottomBarButtonTextLeft}>添加紧急联系人</Text>
            </Flex>
          </TouchableOpacity>
        </View>
      ) : null}
    </PageLayout>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  removeEmergencyContact,
  type EmergencyContact,
} from '@/api/emergencyContact';
import { buildDictLabelMap } from '@/api/dict';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import NoData from '@/src/components/noData';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
  formatEmergencyContactName,
  loadEmergencyContacts,
  loadRelationTypeOptions,
} from '@/src/features/profile/emergencyHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EmergencyPage() {
  const navigation = useNavigation<Nav>();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [relationMap, setRelationMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [list, relationOptions] = await Promise.all([
        loadEmergencyContacts({ pageNum: 1, pageSize: 50 }),
        loadRelationTypeOptions(),
      ]);
      setContacts(list);
      setRelationMap(buildDictLabelMap(relationOptions));
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRef = useRef(load);
  loadRef.current = load;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    loadRef.current();
  }, []);

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container}>
      {contacts.length > 0 ? (
        <ScrollView style={styles.body}>
          {contacts.map(contact => (
            <View key={String(contact.id)} style={[styles.infoBox, { marginTop: 6 }]}>
              <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                <TouchableOpacity
                  style={styles.familyItemContent1}
                  activeOpacity={0.7}
                  onPress={() => handleEdit(contact)}>
                  <Flex align="center">
                    <Text style={styles.familyItemName}>
                      {formatEmergencyContactName(contact, relationMap)}
                    </Text>
                    {contact.isDefault === 1 ? (
                      <Flex style={styles.jzBox}>
                        <Text style={styles.jzText}>默认</Text>
                      </Flex>
                    ) : null}
                  </Flex>
                  <Text style={styles.familyItemRelation}>{contact.contactPhone || '—'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(contact)}>
                  <Image style={styles.editIcon} source={require('@/assets/images/user/del.png')} />
                </TouchableOpacity>
              </Flex>
            </View>
          ))}
          <Text style={styles.emergencyText}>
            紧急联系人将在您遇到紧急情况时被通知，建议添加2-3位家人或朋友。
          </Text>
        </ScrollView>
      ) : (
        <View style={[styles.body, { flex: 1 }]}>
          <Flex style={{ flex: 1 }}>
            <NoData />
          </Flex>
          <Text style={styles.emergencyText}>
            紧急联系人将在您遇到紧急情况时被通知，建议添加2-3位家人或朋友。
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <Text style={styles.addText}>添加紧急联系人</Text>
        </Flex>
      </TouchableOpacity>
    </PageLayout>
  );
}

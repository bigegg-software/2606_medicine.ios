import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFamilyMembers, inviteFamilyMember, unbindFamily } from '@/api/family';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/familyBind';
import { isApiOk } from '@/src/utils/apiHelpers';

type Member = { id?: number; name?: string; phone?: string; relationType?: string };

export default function FamilyBindPage() {
  const navigation = useNavigation();
  const [members, setMembers] = useState<Member[]>([]);
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('子女');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getFamilyMembers();
    if (isApiOk(res as { code?: number })) {
      const d = (res as { data?: unknown }).data;
      setMembers(Array.isArray(d) ? (d as Member[]) : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    if (phone.trim().length !== 11) {
      Alert.alert('提示', '请输入11位手机号');
      return;
    }
    const res = await inviteFamilyMember(phone.trim(), relation);
    if (isApiOk(res as { code?: number })) {
      Alert.alert('成功', '邀请已发送');
      setPhone('');
      load();
    } else {
      Alert.alert('失败', (res as { message?: string }).message ?? '请稍后重试');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} />
      </TouchableOpacity>
      <ListPageLayout title="家属绑定" loading={loading} emptyText={members.length ? undefined : '暂无绑定家属'}>
        <View style={styles.inviteBox}>
          <TextInput style={styles.input} placeholder="家属手机号" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} placeholderTextColor={AppTheme.hintTextColor} />
          <TextInput style={styles.input} placeholder="关系（如：子女）" value={relation} onChangeText={setRelation} placeholderTextColor={AppTheme.hintTextColor} />
          <TouchableOpacity style={styles.btn} onPress={invite}>
            <Text style={styles.btnText}>发送邀请</Text>
          </TouchableOpacity>
        </View>
        {members.map(m => (
          <ListCard
            key={String(m.id)}
            title={m.name ?? m.phone ?? '家属'}
            subtitle={m.relationType ?? ''}
            onDelete={
              m.id
                ? async () => {
                    await unbindFamily(m.id!);
                    load();
                  }
                : undefined
            }
          />
        ))}
      </ListPageLayout>
    </SafeAreaView>
  );
}

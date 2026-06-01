import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getMedicalRecordInfo, removeMedicalRecord, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/health/medicalRecordDetail';
import { apiData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Route = RouteProp<RootStackParamList, 'MedicalRecordDetail'>;

const DETAIL_FIELDS: { key: keyof MedicalRecord; label: string }[] = [
  { key: 'medicalRecordType', label: '就诊类型' },
  { key: 'recordDate', label: '就诊日期' },
  { key: 'hospital', label: '医院' },
  { key: 'medicalDepartment', label: '科室' },
  { key: 'diagnosticResult', label: '诊断结果' },
  { key: 'doctor', label: '主治医生' },
  { key: 'chiefComplaint', label: '主诉' },
  { key: 'presentIllness', label: '现病史' },
  { key: 'pastMedicalHistory', label: '既往史' },
  { key: 'personalHistory', label: '个人史' },
  { key: 'physicalExamination', label: '体格检查' },
  { key: 'previousExaminationResults', label: '既往检查结果' },
  { key: 'medicalSummary', label: '病情摘要' },
];

export default function MedicalRecordDetailPage() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const [data, setData] = useState<MedicalRecord>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMedicalRecordInfo(params.id);
        if (isResourceApiOk(res as { code?: number })) {
          setData(apiData(res as { data?: MedicalRecord }) ?? {});
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, [params.id]);

  const remove = () => {
    Alert.alert('删除', '确定删除该记录？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await removeMedicalRecord(params.id);
            if (isResourceApiOk(res as { code?: number; msg?: string })) {
              navigation.goBack();
            } else {
              const r = res as { msg?: string; message?: string };
              Alert.alert('删除失败', r.msg ?? r.message ?? '请稍后重试');
            }
          } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  const title = data.diagnosticResult || data.hospital || '就医记录';

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {DETAIL_FIELDS.map(({ key, label }) => {
          const value = data[key];
          if (value == null || value === '') return null;
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{String(value)}</Text>
            </View>
          );
        })}
        {data.attachmentList?.length ? (
          <View style={styles.attachSection}>
            <Text style={styles.label}>附件</Text>
            {data.attachmentList.map((att, i) => (
              <TouchableOpacity
                key={att.ossId ?? i}
                style={styles.attachRow}
                onPress={() => att.ossUrl && Linking.openURL(att.ossUrl)}>
                <MaterialIcons name="attach-file" size={20} color={AppTheme.primaryColor} />
                <Text style={styles.attachName} numberOfLines={1}>
                  {att.originalName || att.ossUrl || '附件'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <TouchableOpacity style={styles.deleteBtn} onPress={remove}>
        <Text style={styles.deleteText}>删除记录</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

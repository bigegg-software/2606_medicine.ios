import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle, Header } from '@react-navigation/elements';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { AppTheme } from '@/common/theme';
import type { QuestionnaireType } from '@/api/questionTemplate';
import { LinearGradient } from 'expo-linear-gradient';

import WelcomePage from '@/src/features/auth/WelcomePage';
import LoginPage from '@/src/features/auth/LoginPage';
import RegisterPage from '@/src/features/auth/RegisterPage';
import MainTabs from '@/src/features/home/MainTabs';

// 健康档案
import HealthRecord from '@/src/features/profile/healthRecord';
import CaseNotes from '@/src/features/profile/healthRecord/caseNotes';
import CaseAdd from '@/src/features/profile/healthRecord/caseAdd';
import CaseDetail from '@/src/features/profile/healthRecord/caseDetail';
import CaseCameraPage from '@/src/features/media/CaseCameraPage';
import CaseAlbumPage from '@/src/features/media/CaseAlbumPage';
import Allergies from "@/src/features/profile/healthRecord/allergies"
import AllergiesAdd from "@/src/features/profile/healthRecord/allergiesAdd"
import FamilyHistory from "@/src/features/profile/healthRecord/familyHistory"
import FamilyHistoryAdd from "@/src/features/profile/healthRecord/familyHistoryAdd"
import ProfileEditPage from '@/src/features/profile/healthRecord/ProfileEditPage';

// 用药记录
import MedicationPage from '@/src/features/profile/medication';
import MedicationAddPage from '@/src/features/profile/medication/add';

// 慢病管理
import ChronicDiseasePage from '@/src/features/profile/chronicDisease';
import ChronicDiseaseAddPage from '@/src/features/profile/chronicDisease/add';

// 紧急联系人
import Emergency from '@/src/features/profile/emergency';

// 体征数据
import VitalsPage from '@/src/features/profile/vitals/VitalsPage';

// 社区模块
import ActivityDetailPage from '@/src/features/community/ActivityDetailPage';

// 评估问卷
import QuestionnairePage from '@/src/features/profile/questionnaire';
import QuestionnaireList from '@/src/features/profile/questionnaire/list';
import QuestionnaireDetail from '@/src/features/profile/questionnaire/detail';
import QuestionnaireResult from '@/src/features/profile/questionnaire/result';
import QuestionnaireHistory from '@/src/features/profile/questionnaire/history';


import ScheduleAddPage from '@/src/features/schedule/ScheduleAddPage';
import ScheduleCalendarPage from '@/src/features/schedule/ScheduleCalendarPage';
import FamilyBindPage from '@/src/features/profile/FamilyBindPage';
import MyBedPage from '@/src/features/profile/MyBedPage';
import HealthPage from '@/src/features/health/HealthPage';
import MedicalRecordsPage from '@/src/features/health/MedicalRecordsPage';
import MedicalRecordDetailPage from '@/src/features/health/MedicalRecordDetailPage';
import HealthProfilePage from '@/src/features/health/HealthProfilePage';
import TrainingPage from '@/src/features/training/TrainingPage';
import TrainingExecutionPage from '@/src/features/training/TrainingExecutionPage';
import TrainingHistoryPage from '@/src/features/training/TrainingHistoryPage';
import PrescriptionListPage from '@/src/features/training/PrescriptionListPage';
import PrescriptionDetailPage from '@/src/features/training/PrescriptionDetailPage';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ScheduleAdd: undefined;
  ScheduleCalendar: undefined;
  ActivityDetail: { id: number | string };
  ProfileEditPage: undefined;
  HealthRecord: undefined;
  Emergency: undefined;
  CaseNotes: undefined;
  CaseAdd: undefined;
  CaseCameraPage: { mode?: 'attach' | 'identify' } | undefined;
  CaseAlbumPage: { mode?: 'attach' | 'identify' } | undefined;
  CaseDetail: { id: number };
  QuestionnairePage: { type: QuestionnaireType };
  QuestionnaireList: undefined;
  QuestionnaireDetail: { id: string }
  QuestionnaireResult: { id: string; type: QuestionnaireType };
  QuestionnaireHistory: undefined;
  Allergies: undefined;
  AllergiesAdd: { type: string; editIndex?: number };
  FamilyHistory: undefined;
  FamilyHistoryAdd: { editIndex?: number } | undefined;
  FamilyBind: undefined;
  MyBed: undefined;
  Health: undefined;
  ChronicDisease: undefined;
  ChronicDiseaseAddPage: undefined;
  VitalsPage: undefined;
  Medication: undefined;
  MedicationAddPage: undefined;
  MedicalRecords: undefined;
  MedicalRecordDetail: { id: number };
  Allergy: undefined;
  EmergencyContacts: undefined;
  HealthProfile: undefined;
  Training: { catalogId?: string } | undefined;
  TrainingExecution: {
    prescriptionId: number;
    exerciseId?: number;
    exerciseName?: string;
    targetCount?: number;
    unit?: string;
    durationMinutes?: number;
  };
  TrainingHistory: undefined;
  PrescriptionList: undefined;
  PrescriptionDetail: { id: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function StackHeader({ route, options, back }: NativeStackHeaderProps) {
  return (
    <View style={styles.stackHeader}>
      <LinearGradient
        colors={['#B4D0FF', '#F5F8FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Header
        {...options}
        title={getHeaderTitle(options, route.name)}
        headerTransparent
        headerTintColor={AppTheme.primaryColor}
        headerTitleStyle={{ color: AppTheme.textPrimary, fontWeight: '600' }}
        headerStyle={{ backgroundColor: 'transparent' }}
        headerShadowVisible={false}
        back={back}
      />
      <View style={styles.stackHeaderDivider} />
    </View>
  );
}

function DarkStackHeader({ route, options, back }: NativeStackHeaderProps) {
  return (
    <View style={styles.darkStackHeader}>
      <Header
        {...options}
        title={getHeaderTitle(options, route.name)}
        headerTintColor="#FFFFFF"
        headerTitleStyle={{ color: '#FFFFFF', fontWeight: '600' }}
        headerStyle={{ backgroundColor: '#191926' }}
        headerShadowVisible={false}
        back={back}
      />
      <View style={styles.darkStackHeaderDivider} />
    </View>
  );
}

const darkMediaScreenOptions = {
  header: DarkStackHeader,
  headerStyle: { backgroundColor: '#191926' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { color: '#FFFFFF', fontWeight: '600' as const },
  contentStyle: { backgroundColor: '#191926' },
  statusBarStyle: 'light' as const,
};

const styles = StyleSheet.create({
  stackHeader: {
    paddingLeft: 10,
    overflow: 'hidden',
  },
  stackHeaderDivider: {
    height: 1,
    marginTop: 10,
    backgroundColor: 'rgba(5,58,147,0.06)',
  },
  darkStackHeader: {
    paddingLeft: 10,
    backgroundColor: '#191926',
    overflow: 'hidden',
  },
  darkStackHeaderDivider: {
    height: 1,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default function RootStack() {
  const isLogin = useSelector((s: RootState) => s.login.isLogin);

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        header: StackHeader,
        headerStyle: { backgroundColor: AppTheme.backgroundColor },
        headerShadowVisible: false,
        headerTintColor: AppTheme.primaryColor,
        headerTitleStyle: { color: AppTheme.textPrimary, fontWeight: '600' },
        contentStyle: { backgroundColor: AppTheme.backgroundColor },
        statusBarStyle: 'dark',
      }}
      initialRouteName={isLogin ? 'Home' : 'Welcome'}>
      <Stack.Screen name="Welcome" component={WelcomePage} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Register" component={RegisterPage} />
      <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false, title: "首页" }} />
      <Stack.Screen name="ScheduleAdd" component={ScheduleAddPage} />
      <Stack.Screen name="ScheduleCalendar" component={ScheduleCalendarPage} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailPage} />
      <Stack.Screen name="ProfileEditPage" component={ProfileEditPage} options={{ title: "个人信息修改" }} />
      <Stack.Screen name="HealthRecord" component={HealthRecord} options={{ title: "健康档案" }} />
      <Stack.Screen name="Emergency" component={Emergency} options={{ title: "紧急联系人" }} />
      <Stack.Screen name="CaseNotes" component={CaseNotes} options={{ title: "病例记录" }} />
      <Stack.Screen name="CaseAdd" component={CaseAdd} options={{ title: "添加病例" }} />
      <Stack.Screen name="CaseCameraPage" component={CaseCameraPage} options={{ title: '拍照', ...darkMediaScreenOptions }} />
      <Stack.Screen name="CaseAlbumPage" component={CaseAlbumPage} options={{ title: '相册', ...darkMediaScreenOptions }} />
      <Stack.Screen name="CaseDetail" component={CaseDetail} options={{ title: "病例详情" }} />
      <Stack.Screen name="Allergies" component={Allergies} options={{ title: "过敏记录" }} />
      <Stack.Screen name="AllergiesAdd" component={AllergiesAdd} options={{ title: "添加过敏史" }} />
      <Stack.Screen name="FamilyHistory" component={FamilyHistory} options={{ title: "家族病史" }} />
      <Stack.Screen name="FamilyHistoryAdd" component={FamilyHistoryAdd} options={{ title: "添加家族病史" }} />
      <Stack.Screen name="FamilyBind" component={FamilyBindPage} />
      <Stack.Screen name="MyBed" component={MyBedPage} options={{ title: "我的" }} />
      <Stack.Screen name="ChronicDisease" component={ChronicDiseasePage} options={{ title: "慢病管理" }} />
      <Stack.Screen name="ChronicDiseaseAddPage" component={ChronicDiseaseAddPage} options={{ title: "新增慢病" }} />
      <Stack.Screen name="Health" component={HealthPage} />
      <Stack.Screen name="VitalsPage" component={VitalsPage} options={{ title: "体征监测" }} />
      <Stack.Screen name="Medication" component={MedicationPage} options={{ title: "用药记录" }} />
      <Stack.Screen name="MedicationAddPage" component={MedicationAddPage} options={{ title: "添加用药记录" }} />
      <Stack.Screen name="QuestionnairePage" component={QuestionnairePage} options={{ title: "评估问卷" }} />
      <Stack.Screen name="QuestionnaireList" component={QuestionnaireList} options={{ title: "评估问卷" }} />
      <Stack.Screen name="QuestionnaireDetail" component={QuestionnaireDetail} options={{ title: "评估问卷详情" }} />
      <Stack.Screen name="QuestionnaireResult" component={QuestionnaireResult} options={{ title: "评估问卷结果" }} />
      <Stack.Screen name="QuestionnaireHistory" component={QuestionnaireHistory} options={{ title: "评估问卷历史" }} />
      <Stack.Screen name="MedicalRecords" component={MedicalRecordsPage} />
      <Stack.Screen name="MedicalRecordDetail" component={MedicalRecordDetailPage} />
      <Stack.Screen name="HealthProfile" component={HealthProfilePage} />
      <Stack.Screen name="Training" component={TrainingPage} />
      <Stack.Screen name="TrainingExecution" component={TrainingExecutionPage} />
      <Stack.Screen name="TrainingHistory" component={TrainingHistoryPage} />
      <Stack.Screen name="PrescriptionList" component={PrescriptionListPage} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailPage} />
    </Stack.Navigator>
  );
}

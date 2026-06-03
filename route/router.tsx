import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle, Header } from '@react-navigation/elements';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { AppTheme } from '@/common/theme';
import { LinearGradient } from 'expo-linear-gradient';

import WelcomePage from '@/src/features/auth/WelcomePage';
import LoginPage from '@/src/features/auth/LoginPage';
import RegisterPage from '@/src/features/auth/RegisterPage';
import MainTabs from '@/src/features/home/MainTabs';
import ScheduleAddPage from '@/src/features/schedule/ScheduleAddPage';
import ScheduleCalendarPage from '@/src/features/schedule/ScheduleCalendarPage';
import ActivityDetailPage from '@/src/features/community/ActivityDetailPage';
import ProfileEditPage from '@/src/features/profile/ProfileEditPage';
import HealthRecord from '@/src/features/profile/healthRecord/index';
import Emergency from '@/src/features/profile/emergency';
import CaseNotes from '@/src/features/profile/healthRecord/caseNotes';
import CaseAdd from '@/src/features/profile/healthRecord/caseAdd';
import Allergies from "@/src/features/profile/healthRecord/allergies"
import FamilyHistory from "@/src/features/profile/healthRecord/familyHistory"
import FamilyBindPage from '@/src/features/profile/FamilyBindPage';
import MyBedPage from '@/src/features/profile/MyBedPage';
import HealthPage from '@/src/features/health/HealthPage';
import VitalsPage from '@/src/features/health/VitalsPage';
import MedicationPage from '@/src/features/health/MedicationPage';
import MedicalRecordsPage from '@/src/features/health/MedicalRecordsPage';
import MedicalRecordDetailPage from '@/src/features/health/MedicalRecordDetailPage';
import AllergyPage from '@/src/features/health/AllergyPage';
import EmergencyContactsPage from '@/src/features/health/EmergencyContactsPage';
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
  ProfileEdit: undefined;
  HealthRecord: undefined;
  Emergency: undefined;
  CaseNotes: undefined;
  CaseAdd: undefined;
  Allergies: undefined;
  FamilyHistory: undefined;
  FamilyBind: undefined;
  MyBed: undefined;
  Health: undefined;
  Vitals: undefined;
  Medication: undefined;
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

const styles = StyleSheet.create({
  stackHeader: {
    overflow: 'hidden',
  },
  stackHeaderDivider: {
    height: 1,
    marginTop: 10,
    backgroundColor: 'rgba(5,58,147,0.06)',
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
      }}
      initialRouteName={isLogin ? 'Home' : 'Welcome'}>
      <Stack.Screen name="Welcome" component={WelcomePage} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Register" component={RegisterPage} />
      <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ScheduleAdd" component={ScheduleAddPage} />
      <Stack.Screen name="ScheduleCalendar" component={ScheduleCalendarPage} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailPage} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditPage} />
      <Stack.Screen name="HealthRecord" component={HealthRecord} options={{ title: "健康档案" }} />
      <Stack.Screen name="Emergency" component={Emergency} options={{ title: "紧急联系人" }} />
      <Stack.Screen name="CaseNotes" component={CaseNotes} options={{ title: "病例记录" }} />
      <Stack.Screen name="CaseAdd" component={CaseAdd} options={{ title: "添加病例" }} />
      <Stack.Screen name="Allergies" component={Allergies} options={{ title: "过敏史" }} />
      <Stack.Screen name="FamilyHistory" component={FamilyHistory} options={{ title: "家族病史" }} />
      <Stack.Screen name="FamilyBind" component={FamilyBindPage} />
      <Stack.Screen name="MyBed" component={MyBedPage} options={{ title: "我的" }} />
      <Stack.Screen name="Health" component={HealthPage} />
      <Stack.Screen name="Vitals" component={VitalsPage} />
      <Stack.Screen name="Medication" component={MedicationPage} />
      <Stack.Screen name="MedicalRecords" component={MedicalRecordsPage} />
      <Stack.Screen name="MedicalRecordDetail" component={MedicalRecordDetailPage} />
      <Stack.Screen name="Allergy" component={AllergyPage} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsPage} />
      <Stack.Screen name="HealthProfile" component={HealthProfilePage} />
      <Stack.Screen name="Training" component={TrainingPage} />
      <Stack.Screen name="TrainingExecution" component={TrainingExecutionPage} />
      <Stack.Screen name="TrainingHistory" component={TrainingHistoryPage} />
      <Stack.Screen name="PrescriptionList" component={PrescriptionListPage} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailPage} />
    </Stack.Navigator>
  );
}

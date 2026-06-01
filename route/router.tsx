import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

import WelcomePage from '@/src/features/auth/WelcomePage';
import LoginPage from '@/src/features/auth/LoginPage';
import RegisterPage from '@/src/features/auth/RegisterPage';
import MainTabs from '@/src/features/home/MainTabs';
import ScheduleAddPage from '@/src/features/schedule/ScheduleAddPage';
import ScheduleCalendarPage from '@/src/features/schedule/ScheduleCalendarPage';
import ActivityDetailPage from '@/src/features/community/ActivityDetailPage';
import ProfileEditPage from '@/src/features/profile/ProfileEditPage';
import FamilyBindPage from '@/src/features/profile/FamilyBindPage';
import MyBedPage from '@/src/features/profile/MyBedPage';
import HealthPage from '@/src/features/health/HealthPage';
import VitalsPage from '@/src/features/health/VitalsPage';
import MedicationPage from '@/src/features/health/MedicationPage';
import MedicalRecordsPage from '@/src/features/health/MedicalRecordsPage';
import MedicalRecordDetailPage from '@/src/features/health/MedicalRecordDetailPage';
import AllergyPage from '@/src/features/health/AllergyPage';
import FamilyHistoryPage from '@/src/features/health/FamilyHistoryPage';
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
  MainTabs: undefined;
  ScheduleAdd: undefined;
  ScheduleCalendar: undefined;
  ActivityDetail: { id: number | string };
  ProfileEdit: undefined;
  FamilyBind: undefined;
  MyBed: undefined;
  Health: undefined;
  Vitals: undefined;
  Medication: undefined;
  MedicalRecords: undefined;
  MedicalRecordDetail: { id: number };
  Allergy: undefined;
  FamilyHistory: undefined;
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

export default function RootStack() {
  const isLogin = useSelector((s: RootState) => s.login.isLogin);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName={isLogin ? 'MainTabs' : 'Welcome'}>
      <Stack.Screen name="Welcome" component={WelcomePage} />
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Register" component={RegisterPage} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ScheduleAdd" component={ScheduleAddPage} />
      <Stack.Screen name="ScheduleCalendar" component={ScheduleCalendarPage} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailPage} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditPage} />
      <Stack.Screen name="FamilyBind" component={FamilyBindPage} />
      <Stack.Screen name="MyBed" component={MyBedPage} />
      <Stack.Screen name="Health" component={HealthPage} />
      <Stack.Screen name="Vitals" component={VitalsPage} />
      <Stack.Screen name="Medication" component={MedicationPage} />
      <Stack.Screen name="MedicalRecords" component={MedicalRecordsPage} />
      <Stack.Screen name="MedicalRecordDetail" component={MedicalRecordDetailPage} />
      <Stack.Screen name="Allergy" component={AllergyPage} />
      <Stack.Screen name="FamilyHistory" component={FamilyHistoryPage} />
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

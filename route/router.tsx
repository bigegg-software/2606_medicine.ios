import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle, Header } from '@react-navigation/elements';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { QuestionnaireType } from '@/api/questionTemplate';
import type { MeasureDataItem } from '@/api/measureData';
import { LinearGradient } from 'expo-linear-gradient';

import WelcomePage from '@/src/features/auth/WelcomePage';
import LoginPage from '@/src/features/auth/LoginPage';
import RegisterPage from '@/src/features/auth/RegisterPage';
import MainTabs from '@/src/features/home/MainTabs';

// 运动处方
import ExercisePage from "@/src/features/home/exercise/exercisePage"

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
import AddDataPage from '@/src/features/profile/vitals/addData';
import AllDataPage from '@/src/features/profile/vitals/allData';

// 社区模块
import ActivityDetailPage from '@/src/features/community/ActivityDetailPage';

// 评估问卷
import QuestionnairePage from '@/src/features/profile/questionnaire';
import QuestionnaireList from '@/src/features/profile/questionnaire/list';
import QuestionnaireDetail from '@/src/features/profile/questionnaire/detail';
import QuestionnaireResult from '@/src/features/profile/questionnaire/result';
import QuestionnaireHistory from '@/src/features/profile/questionnaire/history';

//设置 
import SettingsPage from '@/src/features/profile/settings';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ExercisePage: undefined;
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
  SettingsPage: undefined;
  Allergies: undefined;
  AllergiesAdd: { type: string; editIndex?: number };
  FamilyHistory: undefined;
  FamilyHistoryAdd: { editIndex?: number } | undefined;
  FamilyBind: undefined;
  ChronicDisease: undefined;
  ChronicDiseaseAddPage: undefined;
  VitalsPage: undefined;
  AddDataPage: { type?: '血压' | '血糖' | '体温'; item?: MeasureDataItem };
  AllDataPage: { type?: '血压' | '血糖' | '体温' };
  Medication: undefined;
  MedicationAddPage: undefined;
 
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function StackHeader({ route, options, back }: NativeStackHeaderProps) {
  const { scaleSize } = useFontSize();
  const headerTitleStyle = useMemo(
    () => ({ color: AppTheme.textPrimary, fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );

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
        headerTitleStyle={headerTitleStyle}
        headerStyle={{ backgroundColor: 'transparent' }}
        headerShadowVisible={false}
        back={back}
      />
      <View style={styles.stackHeaderDivider} />
    </View>
  );
}

function DarkStackHeader({ route, options, back }: NativeStackHeaderProps) {
  const { scaleSize } = useFontSize();
  const headerTitleStyle = useMemo(
    () => ({ color: '#FFFFFF', fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );

  return (
    <View style={styles.darkStackHeader}>
      <Header
        {...options}
        title={getHeaderTitle(options, route.name)}
        headerTintColor="#FFFFFF"
        headerTitleStyle={headerTitleStyle}
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
  const { scaleSize } = useFontSize();
  const headerTitleStyle = useMemo(
    () => ({ color: AppTheme.textPrimary, fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        header: StackHeader,
        headerStyle: { backgroundColor: AppTheme.backgroundColor },
        headerShadowVisible: false,
        headerTintColor: AppTheme.primaryColor,
        headerTitleStyle,
        contentStyle: { backgroundColor: AppTheme.backgroundColor },
        statusBarStyle: 'dark',
      }}
      initialRouteName={isLogin ? 'Home' : 'Welcome'}>
      <Stack.Screen name="Welcome" component={WelcomePage} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Register" component={RegisterPage} />
      <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false, title: "首页" }} />
      <Stack.Screen name="ExercisePage" component={ExercisePage} options={{ title: "运动处方" }} />
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
      <Stack.Screen name="ChronicDisease" component={ChronicDiseasePage} options={{ title: "慢病管理" }} />
      <Stack.Screen name="ChronicDiseaseAddPage" component={ChronicDiseaseAddPage} options={{ title: "新增慢病" }} />
      <Stack.Screen name="VitalsPage" component={VitalsPage} options={{ title: "体征监测" }} />
      <Stack.Screen name="AddDataPage" component={AddDataPage} options={{ title: "新增记录" }} />
      <Stack.Screen name="AllDataPage" component={AllDataPage} options={{ title: "血压记录" }} />
      <Stack.Screen name="Medication" component={MedicationPage} options={{ title: "用药记录" }} />
      <Stack.Screen name="MedicationAddPage" component={MedicationAddPage} options={{ title: "添加用药记录" }} />
      <Stack.Screen name="QuestionnairePage" component={QuestionnairePage} options={{ title: "评估问卷" }} />
      <Stack.Screen name="QuestionnaireList" component={QuestionnaireList} options={{ title: "评估问卷" }} />
      <Stack.Screen name="QuestionnaireDetail" component={QuestionnaireDetail} options={{ title: "评估问卷详情" }} />
      <Stack.Screen name="QuestionnaireResult" component={QuestionnaireResult} options={{ title: "评估问卷结果" }} />
      <Stack.Screen name="QuestionnaireHistory" component={QuestionnaireHistory} options={{ title: "评估问卷历史" }} />
      <Stack.Screen name="SettingsPage" component={SettingsPage} options={{ title: "设置" }} />
    </Stack.Navigator>
  );
}

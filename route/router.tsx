import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle, Header, HeaderBackButton } from '@react-navigation/elements';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { QuestionnaireType } from '@/api/questionTemplate';
import type { MeasureDataItem } from '@/api/measureData';

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
import MyFamily from '@/src/features/profile/myFamily';
import FamilyDetail from '@/src/features/profile/myFamily/detail';

// AI健康管家
import AssistantPage from '@/src/features/assistant/AssistantPage';

// 里程碑
import CalendarPage from '@/src/features/schedule/calendarPage';
import ScheduleHistoryPage from '@/src/features/schedule/scheduleHistoryPage';
import PlayerPage from '@/src/features/schedule/player';
import TestingPage from '@/src/features/schedule/testing/index';
import TestingResultsPage from '@/src/features/schedule/testing/results';
import TestingRecordPage from '@/src/features/schedule/testing/record';
import QuestionnaireTestingPage from '@/src/features/schedule/testing/questionnaire';
import QuestionnaireTestingRecordPage from '@/src/features/schedule/testing/questionnaireRecord';

// 饮食运动
import NutritionPage from '@/src/features/home/nutrition';

// 用药记录
import MedicationPage from '@/src/features/profile/medication';
import MedicationAddPage from '@/src/features/profile/medication/add';
import MedicationAllPage from '@/src/features/profile/medication/all';
import MedicationHistoryPage from '@/src/features/profile/medication/history';
import MedicationDetailPage from '@/src/features/profile/medication/detail';

//饮食
import MealDetailPage from '@/src/features/profile/medication/meal/detail';
import MealWaterPage from '@/src/features/profile/medication/meal/water';
import MealRecognitionPage from '@/src/features/profile/medication/meal/recognition';
import MealRecognizingPage from '@/src/features/profile/medication/meal/mealRecognizing';
import MealResultPage from '@/src/features/profile/medication/meal/mealResult';
import ManualCorrectionPage from '@/src/features/profile/medication/meal/manualCorrection';
import MealRecordDetailPage from '@/src/features/profile/medication/meal/mealRecordDetail';

// 慢病管理
import ChronicDiseasePage from '@/src/features/profile/chronicDisease';
import ChronicDiseaseAddPage from '@/src/features/profile/chronicDisease/add';
import ChronicDiseaseDetailPage from '@/src/features/profile/chronicDisease/detail';

// 紧急联系人
import Emergency from '@/src/features/profile/emergency';
import EmergencyAdd from '@/src/features/profile/emergencyAdd';

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
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ExercisePage: undefined;
  NutritionPage: undefined;
  ActivityDetail: { id: number | string };
  ProfileEditPage: undefined;
  HealthRecord: undefined;
  Emergency: undefined;
  EmergencyAdd: { id?: number } | undefined;
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
  ChronicDiseaseAddPage: { id?: number } | undefined;
  ChronicDiseaseDetailPage: { id: number } | undefined;
  VitalsPage: undefined;
  AddDataPage: { type?: '血压' | '血糖' | '体温' | '尿酸' | '血脂'; item?: MeasureDataItem };
  AllDataPage: { type?: '血压' | '血糖' | '体温' | '尿酸' | '血脂' | '血氧' | '心率' | '步数' | '消耗' };
  CalendarPage: undefined;
  ScheduleHistoryPage: undefined;
  PlayerPage: {
    exerciseType?: string;
    exerciseChildType?: string;
    strengthLevel?: string;
    taskIndex?: number;
  } | undefined;
  TestingPage: { id: string },
  TestingResultsPage: { healthTestItemId: string; recordOnly?: boolean },
  TestingRecordPage: { healthTestItemId: string },
  QuestionnaireTestingPage: { id: string },
  QuestionnaireTestingRecordPage: { questionnaireType: QuestionnaireType; title?: string },
  Medication: { tab?: 'medication' | 'meal'; resetMealInput?: boolean } | undefined;
  MedicationAddPage: { medicationPlanId?: number } | undefined;
  MedicationAllPage: undefined;
  MedicationHistoryPage: undefined;
  MedicationDetailPage: { drugPatientRuleId: number } | undefined;
  MealDetailPage: undefined;
  MealRecordDetailPage: { mealDetailId: number };
  MealWaterPage: undefined;
  MealRecognitionPage: { text?: string } | undefined;
  MealRecognizingPage:
  | { mode: 'text'; text: string }
  | { mode: 'image'; imageUri: string; text?: string };
  ManualCorrectionPage: {
    itemIndex: number;
    item: import('@/api/mealRecognition').FoodIdentifyItem;
    state: import('@/src/features/profile/medication/meal/components/FoodDetailCard').FoodItemEditState;
    recordTime: string;
    onSave?: (payload: import('@/src/features/profile/medication/meal/manualCorrectionHelpers').ManualCorrectionSavePayload) => void;
  };
  MealResultPage: {
    ossUrl?: string;
    ossId?: number;
    foodIdentifyId?: number;
    analysisResult?: import('@/api/mealRecognition').FoodIdentifyItem[];
    hasFood?: boolean;
  } | undefined;
  AssistantPage: undefined;
  MyFamily: undefined;
  FamilyDetail: undefined;
};

const Stack: any = createNativeStackNavigator<RootStackParamList>();


function StackHeader({ route, options, back, navigation }: any) {
  const { scaleSize } = useFontSize();
  const showHeaderBackground = options.showHeaderBackground !== false;
  const headerTitleStyle = useMemo(
    () => ({ color: AppTheme.textPrimary, fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );

  const canGoBack = navigation.canGoBack();
  return (
    <View
      style={[
        styles.stackHeader,
        !showHeaderBackground ? styles.stackHeaderPlain : null,
      ]}>
      <Header
        {...options}
        title={options.headerTitle != null ? undefined : getHeaderTitle(options, route.name)}
        headerTitle={options.headerTitle}
        headerTransparent={showHeaderBackground}
        headerTintColor={AppTheme.primaryColor}
        headerTitleStyle={headerTitleStyle}
        headerStyle={{
          backgroundColor: showHeaderBackground ? 'transparent' : '#FFFFFF',
        }}
        headerShadowVisible={false}
        headerRight={options.headerRight}
        headerLeft={
          options.headerLeft !== undefined
            ? options.headerLeft
            : canGoBack
              ? props => (
                <HeaderBackButton
                  {...props}
                  tintColor={AppTheme.primaryColor}
                  onPress={navigation.goBack}
                />
              )
              : undefined
        }
        back={back}
      />
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
  stackHeaderPlain: {
    backgroundColor: '#FFFFFF',
  },
  darkStackHeader: {
    paddingLeft: 10,
    backgroundColor: '#191926',
    overflow: 'hidden',
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
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerTintColor: AppTheme.primaryColor,
        headerTitleStyle,
        contentStyle: { backgroundColor: 'transparent' },
        statusBarStyle: 'dark',
      }}
      initialRouteName={isLogin ? 'MainTabs' : 'Login'}>
      <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false, title: "登录" }} />
      <Stack.Screen name="Register" component={RegisterPage} options={{ headerShown: false, title: "注册" }} />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ title: '', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="ExercisePage" component={ExercisePage} options={{ title: "运动处方" }} />
      <Stack.Screen name="NutritionPage" component={NutritionPage} options={{ title: "饮食运动" }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailPage} />
      <Stack.Screen name="ProfileEditPage" component={ProfileEditPage} options={{ title: "个人信息修改" }} />
      <Stack.Screen name="MyFamily" component={MyFamily} options={{ title: "我的家人" }} />
      <Stack.Screen name="FamilyDetail" component={FamilyDetail} options={{ title: "家人详情" }} />
      <Stack.Screen name="HealthRecord" component={HealthRecord} options={{ title: "健康档案" }} />
      <Stack.Screen name="Emergency" component={Emergency} options={{ title: "紧急联系人" }} />
      <Stack.Screen name="EmergencyAdd" component={EmergencyAdd} options={{ title: "添加紧急联系人" }} />
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
      <Stack.Screen name="ChronicDiseaseDetailPage" component={ChronicDiseaseDetailPage} options={{ title: "慢病详情" }} />
      <Stack.Screen name="VitalsPage" component={VitalsPage} options={{ title: "体征监测" }} />
      <Stack.Screen name="AddDataPage" component={AddDataPage} options={{ title: "新增记录" }} />
      <Stack.Screen name="AllDataPage" component={AllDataPage} options={{ title: "血压记录" }} />
      <Stack.Screen name="CalendarPage" component={CalendarPage} options={{ title: "日历视图" }} />
      <Stack.Screen name="ScheduleHistoryPage" component={ScheduleHistoryPage} options={{ title: '历史计划' }} />
      <Stack.Screen name="PlayerPage" component={PlayerPage} options={{ title: '' , showHeaderBackground: false }} />
      <Stack.Screen name="TestingPage" component={TestingPage} options={{ title: '' }} />
      <Stack.Screen name="TestingResultsPage" component={TestingResultsPage} options={{ title: '', showHeaderBackground: false  }} />
      <Stack.Screen name="TestingRecordPage" component={TestingRecordPage} options={{ title: '测试记录', showHeaderBackground: false }} />
      <Stack.Screen name="QuestionnaireTestingPage" component={QuestionnaireTestingPage} options={{ title: '评估问卷'}} />
      <Stack.Screen name="QuestionnaireTestingRecordPage" component={QuestionnaireTestingRecordPage} options={{ title: '评估记录', showHeaderBackground: false }} />
      <Stack.Screen name="Medication" component={MedicationPage} options={{ title: '用药记录' }} />
      <Stack.Screen name="MedicationAddPage" component={MedicationAddPage} options={{ title: '添加用药记录' }} />
      <Stack.Screen name="MedicationAllPage" component={MedicationAllPage} options={{ title: '所有用药' }} />
      <Stack.Screen name="MedicationHistoryPage" component={MedicationHistoryPage} options={{ title: '用药历史' }} />
      <Stack.Screen name="MedicationDetailPage" component={MedicationDetailPage} options={{ title: '处方详情' }} />
      <Stack.Screen name="MealDetailPage" component={MealDetailPage} options={{ title: '营养目标详情' }} />
      <Stack.Screen name="MealRecordDetailPage" component={MealRecordDetailPage} options={{ title: '用餐详情' }} />
      <Stack.Screen name="MealWaterPage" component={MealWaterPage} options={{ title: '记录饮水' }} />
      <Stack.Screen name="MealRecognitionPage" component={MealRecognitionPage} options={{ title: '用餐识别', ...darkMediaScreenOptions }} />
      <Stack.Screen name="MealRecognizingPage" component={MealRecognizingPage} options={{ title: '用餐识别' }} />
      <Stack.Screen name="MealResultPage" component={MealResultPage} options={{ title: '记录饮食' }} />
      <Stack.Screen name="ManualCorrectionPage" component={ManualCorrectionPage} options={{ title: '手动更正' }} />
      <Stack.Screen name="AssistantPage" component={AssistantPage} options={{ title: 'AI健康管家' }} />
      <Stack.Screen name="QuestionnairePage" component={QuestionnairePage} options={{ title: '评估问卷', gestureEnabled: false }} />
      <Stack.Screen name="QuestionnaireList" component={QuestionnaireList} options={{ title: "评估问卷" }} />
      <Stack.Screen name="QuestionnaireDetail" component={QuestionnaireDetail} options={{ title: "评估问卷详情" }} />
      <Stack.Screen name="QuestionnaireResult" component={QuestionnaireResult} options={{ title: "评估问卷结果" }} />
      <Stack.Screen name="QuestionnaireHistory" component={QuestionnaireHistory} options={{ title: "评估问卷历史" }} />
      <Stack.Screen name="SettingsPage" component={SettingsPage} options={{ title: "设置" }} />
    </Stack.Navigator>
  );
}

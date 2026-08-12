import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { getHeaderTitle, Header, HeaderBackButton } from '@react-navigation/elements';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { QuestionnaireType } from '@/api/questionTemplate';
import type { MeasureDataItem } from '@/api/measureData';


import IndexPage from '@/src/features/auth/indexPage';
import LoginPage from '@/src/features/auth/LoginPage';
import RegisterPage from '@/src/features/auth/RegisterPage';
import IdentitySelectPage from '@/src/features/auth/identitySelect';
import MainTabs from '@/src/features/home/MainTabs';
import FamilyTabs from '@/src/familyPage/FamilyTabs';
import { getAuthHomeRoute } from '@/src/features/auth/utils/identityHelpers';
import type { MainTabParamList } from '@/src/utils/tabNavigation';
import type { FamilyTabParamList } from '@/src/familyPage/FamilyTabs';

// 运动处方
import ExercisePage from "@/src/features/exercise/index"

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

// AI健康管家
import AssistantPage from '@/src/features/assistant/AssistantPage';

// 测试页
import PolarDeviceTestPage from '@/src/test/polarDevice';

// 里程碑
import CalendarPage from '@/src/features/schedule/calendarPage';
import ScheduleHistoryPage from '@/src/features/schedule/scheduleHistoryPage';
import ScheduleHistoryDetailPage from '@/src/features/schedule/ScheduleHistoryDetailPage';
import TrainingStatsPage from '@/src/features/schedule/TrainingStatsPage';
import PlayerPage from '@/src/features/schedule/player';
import ExercisePlayerPage from '@/src/features/exercise/player';
import TestingPage from '@/src/features/schedule/testing/index';
import TestingResultsPage from '@/src/features/schedule/testing/results';
import TestingRecordPage from '@/src/features/schedule/testing/record';
import QuestionnaireTestingPage from '@/src/features/schedule/testing/questionnaire';
import QuestionnaireTestingRecordPage from '@/src/features/schedule/testing/questionnaireRecord';

// 营养处方新
import NutritionPage from '@/src/features/nutrition';
import MealRecognizingPage from '@/src/features/nutrition/mealRecognizing';
import FoodRecordingPage from '@/src/features/nutrition/foodRecording';


// 用药记录
import MedicationPage from '@/src/features/profile/medication';
import MedicationAddPage from '@/src/features/profile/medication/add';
import MedicationAllPage from '@/src/features/profile/medication/all';
import MedicationHistoryPage from '@/src/features/profile/medication/history';
import MedicationDetailPage from '@/src/features/profile/medication/detail';

//饮食
import MealDetailPage from '@/src/features/profile/medication/meal/detail';
import MealWaterPage from '@/src/features/profile/medication/meal/water';
import MealRecognitionPage from '@/src/features/nutrition/recognition';
import MealResultPage from '@/src/features/nutrition/mealResult';
import FoodDetailPage from '@/src/features/nutrition/foodDetail';
import ManualCorrectionPage from '@/src/features/nutrition/manualCorrection';
import MealRecordDetailPage from '@/src/features/nutrition/mealRecordDetail';
import MealHistoryPage from '@/src/features/nutrition/MealHistoryPage';
import MealDayDetailPage from '@/src/features/nutrition/MealDayDetailPage';

// 慢病管理
import ChronicDiseasePage from '@/src/features/profile/chronicDisease';
import ChronicDiseaseAddPage from '@/src/features/profile/chronicDisease/add';
import ChronicDiseaseDetailPage from '@/src/features/profile/chronicDisease/detail';

// 紧急联系人
import Emergency from '@/src/features/profile/emergency';
import EmergencyAdd from '@/src/features/profile/emergencyAdd';

// 健康数据
import VitalsPage from '@/src/features/profile/vitals/VitalsPage';
import AddDataPage from '@/src/features/profile/vitals/addData';
import AllDataPage from '@/src/features/profile/vitals/allData';
import BloodPressurePage from '@/src/features/profile/vitals/detail/bloodPressure';
import BloodSugarPage from '@/src/features/profile/vitals/detail/bloodSugar';
import HeartRatePage from '@/src/features/profile/vitals/detail/heartRate';
import SleepPage from '@/src/features/profile/vitals/detail/sleep';
import BloodOxygenPage from '@/src/features/profile/vitals/detail/bloodOxygen';
import BodyTemperaturePage from '@/src/features/profile/vitals/detail/bodyTemperature';
import StepsPage from '@/src/features/profile/vitals/detail/steps';
import ConsumptionPage from '@/src/features/profile/vitals/detail/consumption';
import WeightPage from '@/src/features/profile/vitals/detail/weightPage';
import BloodLipidPage from '@/src/features/profile/vitals/detail/blooLipid';
import UricAcidPage from '@/src/features/profile/vitals/detail/uricAcid';
import SortPage from '@/src/features/profile/vitals/sort';


// 社区模块
import ActivityDetailPage from '@/src/features/community/ActivityDetailPage';
import CourseDetailPage from '@/src/features/community/CourseDetailPage';
import LiveDetailPage from '@/src/features/community/LiveDetailPage';

// 评估问卷
import QuestionnairePage from '@/src/features/profile/questionnaire';
import QuestionnaireList from '@/src/features/profile/questionnaire/list';
import QuestionnaireDetail from '@/src/features/profile/questionnaire/detail';
import QuestionnaireResult from '@/src/features/profile/questionnaire/result';
import QuestionnaireHistory from '@/src/features/profile/questionnaire/history';

//设置 
import FontSizeSettingPage from '@/src/features/profile/settingPage/FontSizeSetting';
import SpeechSpeedSettingPage from '@/src/features/profile/settingPage/SpeechSpeedSetting';
import NotificationSettingPage from '@/src/features/profile/settingPage/NotificationSetting';
import DataManageSettingPage from '@/src/features/profile/settingPage/DataManageSetting';
import DeleteAccountVerifyPage from '@/src/features/profile/settingPage/DeleteAccountVerifyPage';
import AboutUs from '@/src/features/profile/aboutUs';
import FeedbackPage from '@/src/features/feedback/index';

// 积分记录
import RecordPointsPage from '@/src/features/profile/recordPoints';
// 家人
import MyFamily from '@/src/features/profile/myFamily';
import MyFamilyAdd from '@/src/features/profile/myFamily/add';
import FamilyDetail from '@/src/features/profile/myFamily/detail';
import FamilyBindInvitePage from '@/src/familyPage/profilePage/FamilyBindInvitePage';


//实名认证
import AuthenticationPage from "@/src/features/authentication/index"
import IdCardCameraPage from '@/src/features/authentication/IdCardCameraPage'


//消息
import MessagePage from '@/src/features/message';

export type RootStackParamList = {
  IndexPage: undefined;
  Login: undefined;
  Register: undefined;
  IdentitySelectPage: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  FamilyTabs: NavigatorScreenParams<FamilyTabParamList> | undefined;
  ExercisePage: undefined;
  NutritionPage: { tab?: 'diet' | 'prescription' } | undefined;
  ActivityDetail: { id: number | string };
  CourseDetail: { courseId: string };
  LiveDetail: { liveId: string };
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
  FontSizeSettingPage: undefined;
  SpeechSpeedSettingPage: undefined;
  NotificationSettingPage: undefined;
  DataManageSettingPage: undefined;
  DeleteAccountVerifyPage: undefined;
  AuthenticationPage: undefined;
  IdCardCameraPage: { side: 'front' | 'back' };
  MessagePage: undefined;
  Allergies: undefined;
  AllergiesAdd: { type: string; editIndex?: number };
  FamilyHistory: undefined;
  FamilyHistoryAdd: { editIndex?: number } | undefined;
  FamilyBind: undefined;
  ChronicDisease: undefined;
  ChronicDiseaseAddPage: { id?: number } | undefined;
  ChronicDiseaseDetailPage: { id: number } | undefined;
  VitalsPage: undefined;
  AddDataPage: { type?: '血压' | '血糖' | '体温' | '尿酸' | '血脂' | '体重'; item?: MeasureDataItem };
  AllDataPage: {
    type?: '血压' | '血糖' | '体温' | '尿酸' | '血脂' | '血氧' | '心率' | '步数' | '消耗' | '体重' | '睡眠';
    /** YYYY-MM-DD，缺省为当天 */
    date?: string;
  };
  BloodPressurePage: undefined;
  BloodSugarPage: undefined;
  HeartRatePage: undefined;
  SleepPage: undefined;
  BloodOxygenPage: undefined;
  BodyTemperaturePage: undefined;
  StepsPage: undefined;
  ConsumptionPage: undefined;
  WeightPage: undefined;
  BloodLipidPage: undefined;
  UricAcidPage: undefined;
  SortPage: { items: Array<{ key: string; status: string; statusColor: string }> };
  CalendarPage: undefined;
  ScheduleHistoryPage: undefined;
  ScheduleHistoryDetailPage: { exPatientRuleId: string };
  TrainingStatsPage: {
    exPatientRuleId: string;
    startDate?: string;
    endDate?: string;
    initialWeek?: 'current' | 'last';
  };
  PlayerPage: {
    exerciseType?: string;
    exerciseChildType?: string;
    strengthLevel?: string;
    taskIndex?: number;
  } | undefined;
  ExercisePlayerPage: {
    exerciseType?: string;
    exerciseChildType?: string;
    strengthLevel?: string;
    taskIndex?: number;
    exVideoId?: string;
    title?: string;
    ruleSubtitle?: string;
    /** 训练阶段 hot.热身 main.主训练 cold.冷身 */
    trainingPhase?: 'hot' | 'main' | 'cold';
    groupVal?: number;
    numberVal?: number;
    keepSecondVal?: number;
    /** 计时目标分钟（duration_min） */
    durationMinutes?: number;
    /** duration_min | group_number | keep_second_number */
    timerType?: string;
    /** 历史日期只读查看 */
    readOnly?: boolean;
    customerLocalDate?: string;
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
  MealHistoryPage: undefined;
  MealDayDetailPage: { customerLocalDate: string };
  MealWaterPage: undefined;
  MealRecognitionPage: { text?: string; mealCategory?: number } | undefined;
  MealRecognizingPage:
  | { mode: 'text'; text: string; mealCategory?: number }
  | { mode: 'image'; imageUri: string; text?: string; mealCategory?: number };
  FoodRecordingPage: undefined;
  ManualCorrectionPage: {
    itemIndex: number;
    item: import('@/api/mealRecognition').FoodIdentifyItem;
    state: import('@/src/features/profile/medication/meal/components/FoodDetailCard').FoodItemEditState;
    recordTime: string;
    onSave?: (payload: import('@/src/features/nutrition/utils/manualCorrectionHelpers').ManualCorrectionSavePayload) => void;
    /** 单个食物识别模式：展示并回传餐段，保存时直接提交记录 */
    showMealPeriod?: boolean;
    mealCategory?: number;
    ossId?: number;
    foodIdentifyId?: number;
  };
  FoodDetailPage: {
    itemIndex: number;
    item: import('@/api/mealRecognition').FoodIdentifyItem;
    state: import('@/src/features/profile/medication/meal/components/FoodDetailCard').FoodItemEditState;
    recordTime: string;
    onSave?: (payload: import('@/src/features/nutrition/utils/manualCorrectionHelpers').ManualCorrectionSavePayload) => void;
    onDelete?: (itemIndex: number) => void;
    /** 识别到单种食物：独立保存，不回写父页 */
    mode?: 'edit' | 'recognizeSave';
    mealCategory?: number;
    ossId?: number;
    ossUrl?: string;
    foodIdentifyId?: number;
  };
  MealResultPage: {
    ossUrl?: string;
    ossId?: number;
    foodIdentifyId?: number;
    analysisResult?: import('@/api/mealRecognition').FoodIdentifyItem[];
    hasFood?: boolean;
    mealCategory?: number;
    /** 上游已补充其他营养时跳过二次请求 */
    skipFillOthers?: boolean;
  } | undefined;
  AssistantPage: { chatId?: string; startNew?: boolean } | undefined;
  PolarDeviceTestPage: undefined;
  MyFamily: undefined;
  MyFamilyAdd: undefined;
  FamilyDetail: { id: string };
  FamilyBindInvitePage: { messageId?: string; id?: string };
};

const Stack: any = createNativeStackNavigator<RootStackParamList>();


function StackHeader({ route, options, back, navigation }: any) {
  const { scaleSize } = useFontSize();
  const showHeaderBackground = options.showHeaderBackground !== false;
  const plainHeaderColor = options.headerBackgroundColor ?? '#FFFFFF';
  const headerTitleStyle = useMemo(
    () => ({ color: AppTheme.textPrimary, fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );

  const canGoBack = navigation.canGoBack();
  return (
    <View
      style={[
        styles.stackHeader,
        !showHeaderBackground ? { backgroundColor: plainHeaderColor } : null,
      ]}>
      <Header
        {...options}
        title={options.headerTitle != null ? undefined : getHeaderTitle(options, route.name)}
        headerTitle={options.headerTitle}
        headerTransparent={showHeaderBackground}
        headerTintColor="#000000"
        headerTitleStyle={headerTitleStyle}
        headerStyle={{
          backgroundColor: showHeaderBackground ? 'transparent' : plainHeaderColor,
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
                  tintColor="#000000"
                  displayMode="minimal"
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
  headerBackTitleVisible: false,
  headerBackTitle: '',
  headerBackButtonDisplayMode: 'minimal' as const,
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
  const identityPerspective = useSelector(
    (s: RootState) => s.user.systemUser?.identityPerspective,
  );
  const { scaleSize } = useFontSize();
  const headerTitleStyle = useMemo(
    () => ({ color: AppTheme.textPrimary, fontWeight: '600' as const, fontSize: scaleSize(17) }),
    [scaleSize],
  );
  const initialRouteName = useMemo(() => {
    if (!isLogin) return 'IndexPage';
    return getAuthHomeRoute(identityPerspective);
  }, [identityPerspective, isLogin]);

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        header: StackHeader,
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerTintColor: '#000000',
        headerTitleStyle,
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: 'transparent' },
        statusBarStyle: 'dark',
      }}
      initialRouteName={initialRouteName}>
      <Stack.Screen name="IndexPage" component={IndexPage} options={{ headerShown: false, title: "登录" }} />
      <Stack.Screen name="Login" component={LoginPage} options={{ title: "" }} />
      <Stack.Screen name="Register" component={RegisterPage} options={{ title: "" }} />
      <Stack.Screen
        name="IdentitySelectPage"
        component={IdentitySelectPage}
        options={{ headerShown: false, title: '选择身份', gestureEnabled: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ title: '', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen
        name="FamilyTabs"
        component={FamilyTabs}
        options={{ title: '首页', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="ExercisePage" component={ExercisePage} options={{ title: "运动处方" }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailPage} options={{ title: "" }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailPage} options={{ title: "" }} />
      <Stack.Screen name="LiveDetail" component={LiveDetailPage} options={{ title: "" }} />
      <Stack.Screen name="ProfileEditPage" component={ProfileEditPage} options={{ title: "个人信息修改" }} />
      <Stack.Screen name="MyFamily" component={MyFamily} options={{ title: "我的家人" }} />
      <Stack.Screen name="MyFamilyAdd" component={MyFamilyAdd} options={{ title: "添加家人" }} />
      <Stack.Screen name="FamilyDetail" component={FamilyDetail} options={{ title: "家人详情" }} />
      <Stack.Screen
        name="FamilyBindInvitePage"
        component={FamilyBindInvitePage}
        options={{ title: '家人邀请' }}
      />
      <Stack.Screen name="AboutUsPage" component={AboutUs} options={{ title: "关于我们", showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="PolarDeviceTestPage" component={PolarDeviceTestPage} options={{ title: 'Polar H10 测试' }} />
      <Stack.Screen name="FeedbackPage" component={FeedbackPage} options={{ title: "帮助与反馈" }} />
      <Stack.Screen name="HealthRecord" component={HealthRecord} options={{ title: "健康档案" }} />
      <Stack.Screen name="Emergency" component={Emergency} options={{ title: "紧急联系人" }} />
      <Stack.Screen name="EmergencyAdd" component={EmergencyAdd} options={{ title: "添加紧急联系人" }} />
      <Stack.Screen name="CaseNotes" component={CaseNotes} options={{ title: "病例记录" }} />
      <Stack.Screen name="CaseAdd" component={CaseAdd} options={{ title: "添加病例", showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="CaseCameraPage" component={CaseCameraPage} options={{ title: '拍照', ...darkMediaScreenOptions }} />
      <Stack.Screen name="CaseAlbumPage" component={CaseAlbumPage} options={{ title: '相册', ...darkMediaScreenOptions }} />
      <Stack.Screen name="CaseDetail" component={CaseDetail} options={{ title: "病例详情", showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="Allergies" component={Allergies} options={{ title: "过敏记录" }} />
      <Stack.Screen name="AllergiesAdd" component={AllergiesAdd} options={{ title: "添加过敏史" }} />
      <Stack.Screen name="FamilyHistory" component={FamilyHistory} options={{ title: "家族病史" }} />
      <Stack.Screen name="FamilyHistoryAdd" component={FamilyHistoryAdd} options={{ title: "添加家族病史" }} />
      <Stack.Screen name="ChronicDisease" component={ChronicDiseasePage} options={{ title: "慢病管理" }} />
      <Stack.Screen name="ChronicDiseaseAddPage" component={ChronicDiseaseAddPage} options={{ title: "新增慢病", showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="ChronicDiseaseDetailPage" component={ChronicDiseaseDetailPage} options={{ title: "慢病详情" }} />
      <Stack.Screen name="VitalsPage" component={VitalsPage} options={{ title: "健康数据" }} />
      <Stack.Screen name="AddDataPage" component={AddDataPage} options={{ title: "新增记录", showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="AllDataPage" component={AllDataPage} options={{ title: "血压记录", showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="BloodPressurePage" component={BloodPressurePage} options={{ title: "血压", showHeaderBackground: false }} />
      <Stack.Screen name="BloodSugarPage" component={BloodSugarPage} options={{ title: "血糖", showHeaderBackground: false }} />
      <Stack.Screen name="HeartRatePage" component={HeartRatePage} options={{ title: "心率", showHeaderBackground: false }} />
      <Stack.Screen name="SleepPage" component={SleepPage} options={{ title: "睡眠", showHeaderBackground: false }} />
      <Stack.Screen name="BloodOxygenPage" component={BloodOxygenPage} options={{ title: "血氧", showHeaderBackground: false }} />
      <Stack.Screen name="BodyTemperaturePage" component={BodyTemperaturePage} options={{ title: "体温", showHeaderBackground: false }} />
      <Stack.Screen name="StepsPage" component={StepsPage} options={{ title: "步数", showHeaderBackground: false }} />
      <Stack.Screen name="ConsumptionPage" component={ConsumptionPage} options={{ title: "消耗", showHeaderBackground: false }} />
      <Stack.Screen name="WeightPage" component={WeightPage} options={{ title: "体重", showHeaderBackground: false }} />
      <Stack.Screen name="BloodLipidPage" component={BloodLipidPage} options={{ title: "血脂", showHeaderBackground: false }} />
      <Stack.Screen name="UricAcidPage" component={UricAcidPage} options={{ title: "尿酸", showHeaderBackground: false }} />
      <Stack.Screen name="SortPage" component={SortPage} options={{ title: "健康数据", showHeaderBackground: false }} />
      <Stack.Screen name="CalendarPage" component={CalendarPage} options={{ title: "日历视图" }} />
      <Stack.Screen name="ScheduleHistoryPage" component={ScheduleHistoryPage} options={{ title: '历史计划' }} />
      <Stack.Screen
        name="ScheduleHistoryDetailPage"
        component={ScheduleHistoryDetailPage}
        options={{ title: '历史处方详情' }}
      />
      <Stack.Screen name="TrainingStatsPage" component={TrainingStatsPage} options={{ title: '训练统计' }} />
      <Stack.Screen name="PlayerPage" component={PlayerPage} options={{ title: '', showHeaderBackground: false, gestureEnabled: false }} />
      <Stack.Screen name="ExercisePlayerPage" component={ExercisePlayerPage} options={{ title: '', showHeaderBackground: false, gestureEnabled: false }} />
      <Stack.Screen name="TestingPage" component={TestingPage} options={{ title: '' }} />
      <Stack.Screen name="TestingResultsPage" component={TestingResultsPage} options={{ title: '', showHeaderBackground: false }} />
      <Stack.Screen name="TestingRecordPage" component={TestingRecordPage} options={{ title: '测试记录', showHeaderBackground: false }} />
      <Stack.Screen name="QuestionnaireTestingPage" component={QuestionnaireTestingPage} options={{ title: '评估问卷' }} />
      <Stack.Screen name="QuestionnaireTestingRecordPage" component={QuestionnaireTestingRecordPage} options={{ title: '评估记录', showHeaderBackground: false }} />
      <Stack.Screen name="Medication" component={MedicationPage} options={{ title: '用药记录' }} />
      <Stack.Screen name="MedicationAddPage" component={MedicationAddPage} options={{ title: '添加用药记录' }} />
      <Stack.Screen name="MedicationAllPage" component={MedicationAllPage} options={{ title: '所有用药' }} />
      <Stack.Screen name="MedicationHistoryPage" component={MedicationHistoryPage} options={{ title: '用药历史' }} />
      <Stack.Screen name="MedicationDetailPage" component={MedicationDetailPage} options={{ title: '处方详情' }} />
      <Stack.Screen name="MealDetailPage" component={MealDetailPage} options={{ title: '营养目标详情' }} />
      <Stack.Screen
        name="MealRecordDetailPage"
        component={MealRecordDetailPage}
        options={{ title: '食物详情', showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }}
      />
      <Stack.Screen name="MealHistoryPage" component={MealHistoryPage} options={{ title: '饮食记录' }} />
      <Stack.Screen name="MealDayDetailPage" component={MealDayDetailPage} options={{ title: '饮食详情' }} />
      <Stack.Screen name="MealWaterPage" component={MealWaterPage} options={{ title: '记录饮水' }} />
      <Stack.Screen name="MealRecognitionPage" component={MealRecognitionPage} options={{ title: '用餐识别', headerShown: false, statusBarStyle: 'light' }} />
      <Stack.Screen name="MealRecognizingPage" component={MealRecognizingPage} options={{ title: '用餐识别', showHeaderBackground: false }} />
      <Stack.Screen name="FoodRecordingPage" component={FoodRecordingPage} options={{ title: '饮食记录', showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="MealResultPage" component={MealResultPage} options={{ title: '', showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="FoodDetailPage" component={FoodDetailPage} options={{ title: '食物详情', showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="ManualCorrectionPage" component={ManualCorrectionPage} options={{ title: '手动更正', showHeaderBackground: false, headerBackgroundColor: '#F7F7F9' }} />
      <Stack.Screen name="AssistantPage" component={AssistantPage} options={{ title: 'AI健康管家' }} />
      <Stack.Screen name="QuestionnairePage" component={QuestionnairePage} options={{ title: '评估问卷', gestureEnabled: false }} />
      <Stack.Screen name="QuestionnaireList" component={QuestionnaireList} options={{ title: "评估问卷" }} />
      <Stack.Screen name="QuestionnaireDetail" component={QuestionnaireDetail} options={{ title: "评估问卷详情" }} />
      <Stack.Screen name="QuestionnaireResult" component={QuestionnaireResult} options={{ title: "评估问卷结果" }} />
      <Stack.Screen name="QuestionnaireHistory" component={QuestionnaireHistory} options={{ title: "评估问卷历史" }} />
      <Stack.Screen name="FontSizeSettingPage" component={FontSizeSettingPage} options={{ title: '字体大小' }} />
      <Stack.Screen name="SpeechSpeedSettingPage" component={SpeechSpeedSettingPage} options={{ title: '语音语速' }} />
      <Stack.Screen name="NotificationSettingPage" component={NotificationSettingPage} options={{ title: '消息通知' }} />
      <Stack.Screen name="DataManageSettingPage" component={DataManageSettingPage} options={{ title: '数据管理' }} />
      <Stack.Screen name="DeleteAccountVerifyPage" component={DeleteAccountVerifyPage} options={{ title: '注销账户' }} />
      <Stack.Screen name="AuthenticationPage" component={AuthenticationPage} options={{ title: "实名认证" }} />
      <Stack.Screen
        name="IdCardCameraPage"
        component={IdCardCameraPage}
        options={{
          headerShown: false,
          statusBarStyle: 'light',
          contentStyle: { backgroundColor: '#000000' },
        }}
      />

      <Stack.Screen name="NutritionPage" component={NutritionPage} options={{ title: "" }} />
      <Stack.Screen name="MessagePage" component={MessagePage} options={{ title: "消息" }} />
      <Stack.Screen name="RecordPointsPage" component={RecordPointsPage} options={{ title: "积分记录" }} />
    </Stack.Navigator>
  );
}

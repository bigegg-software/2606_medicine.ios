import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** 缺席「重新预约」：回到约课 Tab */
export function navigateToCurriculumTab(navigation: Nav) {
  navigation.reset({
    index: 0,
    routes: [{ name: 'MainTabs', params: { screen: 'Curriculum' } }],
  });
}

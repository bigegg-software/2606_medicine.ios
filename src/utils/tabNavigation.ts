export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Assistant: undefined;
  Community: undefined;
  Profile: undefined;
};

export const MAIN_TAB_TITLES: Record<keyof MainTabParamList, string> = {
  Home: '首页',
  Schedule: '里程碑',
  Community: '社区服务',
  Assistant: '首页',
  Profile: '我的',
};

let activeMainTabTitle = MAIN_TAB_TITLES.Home;

export function setActiveMainTabTitle(title: string) {
  activeMainTabTitle = title;
}

export function getActiveMainTabTitle() {
  return activeMainTabTitle;
}

export function getMainTabTitle(routeName: string) {
  return MAIN_TAB_TITLES[routeName as keyof MainTabParamList] ?? MAIN_TAB_TITLES.Home;
}

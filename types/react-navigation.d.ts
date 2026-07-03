import '@react-navigation/native-stack';

declare module '@react-navigation/native-stack' {
  interface NativeStackNavigationOptions {
    /** 为 false 时导航栏与页面顶部使用 #FFFFFF，不显示背景图 */
    showHeaderBackground?: boolean;
  }
}

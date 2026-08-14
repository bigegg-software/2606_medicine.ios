import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { paddingHorizontal: 12, paddingBottom: 40 },
  familyTabBar: {
    marginTop: 10,
    minHeight: 36,
  },
  familyTabBarInner: {
    height: 36,
  },
  familyTabScrollWrap: {
    flex: 1,
    marginRight: 12,
  },
  familyTabScroll: {
    alignItems: 'center',
  },
  familyTabGap: {
    marginLeft: 10,
  },
  familyTabSelected: {
    height: 36,
    minWidth: 52,
    paddingBottom:4,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyTabSelectedText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  familyTabUnselected: {
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 500,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  familyTabUnselectedText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  familyReadonly: {
    flexShrink: 0,
  },
  familyReadonlyIcon: {
    width: 15,
    height: 15,
  },
  familyReadonlyText: {
    marginLeft: 3,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  familyBox: {
    marginTop: 10,
    backgroundColor: '#FEFFFF',
    shadowColor: '#0C3D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 26,
  },
  familyItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(5,58,147,0.06)',
  },
  imgItem: { width: 22, height: 22 },
  familyItemContent: {
    marginLeft: 12,
  },
  familyItemName: {
    fontWeight: '400',
    fontSize: 16,
    color: AppTheme.textPrimary,
  },
  familyItemRelation: {
    marginTop: 4,
    fontWeight: '400',
    fontSize: 12,
    color: '#999',
  },
  tabSize: { width: 58, height: 22 },
  familyListEmpty: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  familyListEmptyText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#999999',
  },
  headerSettingBtn: {
    marginRight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSettingIcon: {
    width: 24,
    height: 24,
  },
});

export default styles;

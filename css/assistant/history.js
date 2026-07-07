import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  navIcon: { width: 24, height: 24 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: AppTheme.textPrimary,
    lineHeight: 22,
  },
  rowTime: {
    marginTop: 6,
    fontSize: 13,
    color: AppTheme.textSecondary,
  },
  footer: { paddingVertical: 16, alignItems: 'center' },
  swipeRow: {
    marginBottom: 10,
    borderRadius: 14,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  swipeAction: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 72, zIndex: 0 },
  swipeForeground: { width: '100%', zIndex: 1, backgroundColor: '#FFFFFF', borderRadius: 14 },
  swipeDeleteBtn: { flex: 1, width: 72, justifyContent: 'center', alignItems: 'center' },
  swipeDeleteIcon: { width: 24, height: 24 },
  rowInSwipe: {
    marginBottom: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  drawerShell: {
    backgroundColor: AppTheme.backgroundColor,
    shadowColor: '#000000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerPanel: {
    flex: 1,
    backgroundColor: AppTheme.backgroundColor,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5,58,147,0.08)',
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: AppTheme.textPrimary,
  },
  drawerHeaderBtn: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  drawerCloseText: {
    fontSize: 15,
    color: AppTheme.primaryColor,
  },
  drawerList: {
    flex: 1,
  },
});

export default styles;

import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  headerLeft: {
    marginLeft: 18,
    alignItems: 'center',
  },
  headerLeftIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  headerLeftText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  navBox: {
    marginHorizontal: 12,
    marginTop: 11,
    height: 43,
    padding: 3,
    backgroundColor: 'rgba(109,146,94,0.12)',
    borderRadius: 25,
    gap: 6,
  },
  navItem: {
    flex: 1,
    height: '100%',
    borderRadius: 25,
    paddingHorizontal: 4,
  },
  activeNavItem: {
    backgroundColor: '#FFF',
  },
  navText: {
    fontWeight: '500',
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  activeNavText: {
    fontWeight: 'bold',
  },
  pageContent: {
    flex: 1,
  },
  tabPage: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

export default styles;

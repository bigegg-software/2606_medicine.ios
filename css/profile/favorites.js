import { StyleSheet, Platform } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },

  tabBar: {
    height: 70,
    paddingHorizontal: 12,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  tabTrack: {
    height: 40,
    backgroundColor: '#EDEEEF',
    borderRadius: 25,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: 34,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#EAEAEA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  tabTextActive: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },

  list: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default styles;

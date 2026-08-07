import { StyleSheet, Platform } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },

  tabBar: {
    height: 70,
    paddingHorizontal: 15,
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
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },

  card: {
    height: 64,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  cardTime: {
    marginTop: 10,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  cardAmount: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardAmountIncome: {
    color: '#6D925E',
  },
  cardAmountExpense: {
    color: '#FB4550',
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
  emptyImage: {
    width: 160,
    height: 120,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default styles;

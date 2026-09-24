import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  headerLeft: {
    marginLeft: 18,
    alignItems: 'center',
    maxWidth: 220,
  },
  headerLeftIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  headerLeftText: {
    flexShrink: 1,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  headerCaret: {
    width: 9,
    height: 4,
    marginLeft: 5,
  },
  sheet: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  sheetTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  sheetScroll: {
    maxHeight: 360,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    paddingVertical: 32,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F7F7F9',
  },
  optionRowSelected: {
    backgroundColor: 'rgba(109,146,94,0.12)',
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  optionName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  optionAddress: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  optionTextSelected: {
    color: AppTheme.primaryColor,
  },
  optionCheck: {
    width: 18,
    height: 18,
    flexShrink: 0,
  },
});

export default styles;

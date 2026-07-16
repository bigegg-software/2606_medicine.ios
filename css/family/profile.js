import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { paddingHorizontal: 12, paddingBottom: 40 },
  modelTitle: {
    marginTop: 14,
    marginLeft: 17,
    fontWeight: '500',
    fontSize: 16,
    color: AppTheme.textPrimary,
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
    paddingVertical: 14,
    height: 58,
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
});

export default styles;

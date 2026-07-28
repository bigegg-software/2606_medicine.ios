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
  familyListEmpty: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  familyListEmptyText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#999999',
  },
  familyListItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(5,58,147,0.06)',
  },
  familyListItemLast: {
    borderBottomWidth: 0,
  },
  familyListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  familyListNameRow: {
    flexShrink: 1,
  },
  familyListName: {
    fontWeight: '500',
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  familyListRelation: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(109,146,94,0.12)',
    fontWeight: 'bold',
    fontSize: 11,
    color: AppTheme.primaryColor,
  },
  familyListStatus: {
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  familyListStatusOk: {
    color: AppTheme.primaryColor,
  },
  familyListStatusFail: {
    color: '#FB4550',
  },
});

export default styles;

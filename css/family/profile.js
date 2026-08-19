import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { flexGrow: 1, paddingHorizontal: 12, paddingBottom: 16 },
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
    paddingBottom: 4,
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
  familyBindEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 125,
  },
  familyBindEmptyIcon: {
    width: 80,
    height: 80,
  },
  familyBindEmptyText: {
    marginTop: 25,
    fontWeight: '500',
    fontSize: 14,
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
  memberCard: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  memberCardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333333"
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    flexShrink: 1,
    marginRight: 8,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  memberCertifiedBadgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#6D925E"
  },
  memberCertifiedBadgeWrapUnCertified: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
    borderWidth: 0,
    backgroundColor: "#F1F5EF"
  },
  memberCertifiedBadge: {
    width: 15,
    height: 15,
    flexShrink: 0,
    marginRight: 2
  },
  memberCertifiedBadgeText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#6D925E"
  },
  memberMeta: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  memberDivider: {
    marginTop: 15,
    alignSelf: 'center',
    width: 321,
    maxWidth: '100%',
    height: 1,
    backgroundColor: '#F0F4FD',
    borderRadius: 1,
  },
  memberInfoRow: {
    marginTop: 15,
  },
  memberInfoIcon: {
    width: 15,
    height: 15,
  },
  memberInfoTitle: {
    width: 90,
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  memberInfoValue: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  memberViewAllBtn: {
    marginTop: 15,
    padding: 13,
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  memberViewAllText: {
    marginRight: 6,
    fontWeight: '500',
    fontSize: 15,
    color: '#6D925E',
  },
  memberViewAllIcon: {
    width: 5,
    height: 9,
  },
  deviceItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7EAEB',
  },
  deviceItemFirst: {
    marginTop: 15,
  },
  deviceItemGap: {
    marginTop: 12,
  },
  deviceIcon: {
    width: 15,
    height: 15,
  },
  deviceName: {
    marginLeft: 3,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  deviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceStatusDotOnline: {
    backgroundColor: '#39BF56',
  },
  deviceStatusDotOffline: {
    backgroundColor: '#CBCBCB',
  },
  deviceStatusText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
  },
  deviceSyncBtn: {
    marginTop: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  deviceSyncIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  deviceSyncText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#6D925E',
  },
  logoutWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  logout: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0C3D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    height: 51,
    borderRadius: 30,
    alignItems: 'center',
  },
  logoutText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default styles;

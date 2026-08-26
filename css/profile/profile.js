import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  pageTitle: {
    height: 27,
    fontWeight: 500,
    fontSize: 18,
    color: AppTheme.textPrimary,
    lineHeight: 27,
    textAlign: "center",
  },
  pageLine: { marginTop: 18, height: 1, backgroundColor: "#053A93", opacity: 0.06 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 12, paddingBottom: 40 },
  avatarBox: { marginTop: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImg: { width: 64, height: 64, borderRadius: 32, marginRight: 12, marginLeft: 8 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  wrzImg: { width: 68, height: 21, marginLeft: 4 },
  avatarIcon: { width: 18, height: 18 },
  avatarValue: { marginLeft: 5, fontWeight: "bold", fontSize: 16, color: "#333333", lineHeight: 19 },
  rlBox: { width: 91, height: 28, marginRight: -12, position: "relative" },
  rlImg: { width: 91, height: 28, position: "absolute" },
  bgImg: { width: '100%', marginTop: 12, borderRadius: 8, overflow: 'hidden' },
  diamondsBox: { padding: 12 },
  diamondsImg: { width: 18, height: 18, marginRight: 6 },
  diamondsTitle: { fontSize: 15, fontWeight: 'bold', color: '#804A15' },
  diamondsDesc: { fontSize: 12, fontWeight: 500, color: '#804A15', marginLeft: 22, marginTop: 2 },
  diamondsSignIn: {
    paddingHorizontal: 10, height: 27, backgroundColor: '#FFFFFF', borderRadius: 13, alignItems: 'center', justifyContent: 'center'
  },
  diamondsSignInText: { fontSize: 12, fontWeight: 500, color: '#804A15' },
  diamondsSignInImg: { width: 18, height: 18 },
  navList: { marginTop: 20, flexWrap: 'wrap' },
  navListItem: { width: '25%', alignItems: 'center' },
  navListItemSecondRow: { marginTop: 15 },
  navListItemImg: { width: 44, height: 44, },
  navListItemText: {
    marginTop: 8,
    height: 20,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textPrimary
  },
  modelTitle: {
    marginTop: 14,
    marginLeft: 17,
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.textPrimary,
  },
  modelTitleRow: {
    marginTop: 24,
    marginRight: 5,
  },
  modelTitleInRow: {
    marginTop: 0,
  },
  familyBox: {
    marginTop: 12,
    backgroundColor: "#FEFFFF",
    shadowColor: "#0C3D9A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderRadius: 12,
    paddingLeft: 18,
    paddingRight: 26,
  },
  familyItem: {
    paddingVertical: 14,
    minHeight: 58,
    borderBottomWidth: 1,
    borderColor: "rgba(5,58,147,0.06)",
  },
  imgBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EBF0FB", },
  imgItem: { width: 22, height: 22 },
  familyItemImg: { width: 44, height: 44, borderRadius: 22 },
  familyItemContent: {
    marginLeft: 12,
  },
  familyItemName: {
    fontWeight: 400,
    fontSize: 16,
    color: AppTheme.textPrimary,
    flexShrink: 1,
  },
  familyItemRelation: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: "#999",
  },
  familyListEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 0,
  },
  familyListStatus: {
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
    flexShrink: 0,
  },
  familyListStatusOk: {
    color: AppTheme.primaryColor,
  },
  familyListStatusFail: {
    color: '#FB4550',
  },
  tabSize: { width: 58, height: 22 },
  logout: { marginTop: 10, backgroundColor: "#FFFFFF", shadowColor: "#0C3D9A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, height: 51, borderRadius: 30, alignItems: 'center' },
  logoutText: { color: '#333333', fontSize: 17, fontWeight: '600' },
  signInOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  signInWrap: {
    width: 278,
    position: 'relative',
    overflow: 'visible',
  },
  imgModel: {
    width: 120,
    height: 130,
    position: 'absolute',
    top: -65,
    left: '50%',
    marginLeft: -60,
    zIndex: 2,
  },
  imgModel1: {
    width: 230,
    height: 13
  },
  signInBox: {
    width: 278,
    borderRadius: 15,
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'visible',
  },
  signInIcon: {
    width: 48,
    height: 48,
    marginTop: 12,
  },
  signInTitleMask: {
    marginTop: 35,
    width: 206,
    height: 25,
  },
  signInTitleGradient: {
    flex: 1,
  },
  signInTitle: {
    width: 206,
    height: 25,
    fontFamily: 'Douyin Sans',
    fontWeight: 'bold',
    fontSize: 22,
    lineHeight: 25,
    textAlign: 'center',
    color: '#000000',
  },
  signInTitleHidden: {
    opacity: 0,
  },
  signInReward: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  signInRewardNum: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#6D925E',
  },
  signInRewardUnit: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6D925E',
  },
  signInTip: {
    marginTop: 10,
    paddingHorizontal: 10,
    lineHeight: 20,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  signInConfirmBtnWrap: {
    marginTop: 15,
    width: 217,
    height: 44,
    borderRadius: 25,
    shadowColor: '#6D925E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  signInConfirmBtn: {
    width: 217,
    height: 44,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInConfirmText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppTheme.borderColor, marginBottom: 16 },
  phone: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
  completion: { fontSize: 13, color: AppTheme.primaryColor, marginTop: 4 },
  pointsBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  points: { fontSize: 18, fontWeight: '700', color: AppTheme.textPrimary },
  signBtn: { height: 48, backgroundColor: AppTheme.primaryColor, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  signBtnDone: { backgroundColor: AppTheme.textSecondary },
  signBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: AppTheme.borderColor, gap: 12 },
  menuLabel: { flex: 1, fontSize: 17, color: AppTheme.textPrimary },
  qyBox: {
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  qyStatusLabelMask: {
    alignSelf: 'flex-start',
  },
  qyStatusLabelGradient: {
    alignSelf: 'flex-start',
  },
  qyStatusLabel: {
    fontFamily: 'Douyin Sans',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000000',
  },
  qyStatusLabelHidden: {
    opacity: 0,
  },
  qyStatusText: {
    fontWeight: 500,
    fontSize: 14,
    color: "#6D925E"
  },
  qyStatusTextUnpaid: {
    color: "#999999",
  },
  qyStatusTime: {
    marginTop: 6,
    fontWeight: 500,
    fontSize: 14,
    color: "#6D925E"
  }
})

export default styles

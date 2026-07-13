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
  avatarImg: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  wrzImg: { width: 68, height: 21, marginLeft: 4 },
  avatarIcon: { width: 18, height: 18 },
  avatarValue: { marginLeft: 5, height: 19, fontWeight: "bold", fontSize: 16, color: "#333333", lineHeight: 19 },
  rlBox: { width: 91, height: 28, marginRight: -12, position: "relative" },
  rlImg: { width: 91, height: 28, position: "absolute" },
  bgImg: { width: '100%', height: 72, marginTop: 20, borderRadius: 8, overflow: 'hidden' },
  diamondsBox: { padding: 12 },
  diamondsImg: { width: 18, height: 18, marginRight: 6 },
  diamondsTitle: { fontSize: 15, fontWeight: 'bold', color: '#804A15' },
  diamondsDesc: { fontSize: 12, fontWeight: 500, color: '#804A15', marginLeft: 22, marginTop: 2 },
  diamondsSignIn: {
    paddingHorizontal: 10, height: 27, backgroundColor: '#FFFFFF', borderRadius: 13, alignItems: 'center', justifyContent: 'center'
  },
  diamondsSignInText: { fontSize: 12, fontWeight: 500, color: '#804A15' },
  diamondsSignInImg: { width: 18, height: 18 },
  navList: { marginTop: 21 },
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
  familyBox: {
    marginTop: 10,
    backgroundColor: "#FEFFFF",
    shadowColor: "#0C3D9A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 26,
  },
  familyItem: { paddingVertical: 14, height: 58, borderBottomWidth: 1, borderColor: "rgba(5,58,147,0.06)" },
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
  },
  familyItemRelation: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: "#999",
  },
  tabSize: { width: 58, height: 22 },
  logout: { marginTop: 10, backgroundColor: "#FFFFFF", shadowColor: "#0C3D9A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, borderRadius: 8, height: 51, borderRadius: 30, alignItems: 'center' },
  logoutText: { color: '#333333', fontSize: 17, fontWeight: '600' },










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
})

export default styles

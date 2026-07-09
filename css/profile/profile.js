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
  scroll: { padding: 18, paddingBottom: 40 },
  avatarBox: { marginTop: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImg: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  avatarIcon: { width: 18, height: 18 },
  avatarValue: { marginLeft: 5, height: 19, fontWeight: "bold", fontSize: 16, color: "#333333", lineHeight: 19 },
  rlBox: { height: 60, marginRight: 16, position: "relative" },
  rlImg: { width: 45, height: 45, position: "absolute", right: 16 },
  qdBox: { marginTop: 34, height: 29, borderRadius: 22, backgroundColor: "#EE9C44", paddingHorizontal: 10 },
  qdText: { fontWeight: 400, fontSize: 14, color: "#FFFFFF" },
  navList: { marginTop: 32 },
  navListItemImg: {width: 44, height: 44,  },
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
    marginTop: 8,
    backgroundColor: "#FEFFFF",
    shadowColor: "#0C3D9A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderRadius: 8,
    paddingLeft: 20,
    paddingRight: 26,
  },
  familyItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(5,58,147,0.06)" },
  imgBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EBF0FB", },
  imgItem: { width: 24, height: 24 },
  familyItemImg: { width: 44, height: 44, borderRadius: 22 },
  familyItemContent: {
    marginLeft: 14,
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
  logout: { marginTop: 12, backgroundColor: "#FEFFFF", shadowColor: "#0C3D9A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, borderRadius: 8, padding: 18, alignItems: 'center' },
  logoutText: { color: AppTheme.primaryColor, fontSize: 17, fontWeight: '600' },










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

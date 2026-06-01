import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppTheme.borderColor, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImg: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  phone: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
  completion: { fontSize: 13, color: AppTheme.primaryColor, marginTop: 4 },
  pointsBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  points: { fontSize: 18, fontWeight: '700', color: AppTheme.textPrimary },
  signBtn: { height: 48, backgroundColor: AppTheme.primaryColor, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  signBtnDone: { backgroundColor: AppTheme.textSecondary },
  signBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: AppTheme.borderColor, gap: 12 },
  menuLabel: { flex: 1, fontSize: 17, color: AppTheme.textPrimary },
  logout: { marginTop: 24, padding: 16, alignItems: 'center' },
  logoutText: { color: AppTheme.dangerColor, fontSize: 17, fontWeight: '600' },
});

export default styles;

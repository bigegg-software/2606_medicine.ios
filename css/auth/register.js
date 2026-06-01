import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '700', color: AppTheme.textPrimary },
  subtitle: { fontSize: 18, color: AppTheme.textSecondary, marginTop: 8, marginBottom: 32 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  fieldLabel: { fontSize: 18, fontWeight: '500', color: AppTheme.textPrimary, marginBottom: 12 },
  fieldLabelText: { fontSize: 18, fontWeight: '500', color: AppTheme.textPrimary },
  inputWrap: { flexDirection: 'row', alignItems: 'center' },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: AppTheme.inputBorderColor,
    borderRadius: AppTheme.radiusLarge,
    paddingHorizontal: 20,
    fontSize: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  eyeBtn: { position: 'absolute', right: 12 },
  codeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  codeBtn: {
    width: 110,
    height: 56,
    borderWidth: 2,
    borderColor: AppTheme.primaryColor,
    borderRadius: AppTheme.radiusLarge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  codeBtnOff: { borderColor: AppTheme.borderColor, backgroundColor: '#F5EDE5' },
  codeBtnText: { fontSize: 16, color: AppTheme.primaryColor, fontWeight: '500' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 28 },
  agreeText: { flex: 1, fontSize: 16, color: AppTheme.textSecondary },
  link: { color: AppTheme.primaryColor, fontWeight: '600' },
  primaryBtn: {
    height: 64,
    backgroundColor: AppTheme.primaryColor,
    borderRadius: AppTheme.radiusLarge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryBtnText: { fontSize: 20, fontWeight: '600', color: '#fff' },
  linkCenter: { textAlign: 'center', fontSize: 18, color: AppTheme.primaryColor, fontWeight: '600' },
});

export default styles;

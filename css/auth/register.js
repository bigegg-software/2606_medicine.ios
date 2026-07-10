import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  body: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 44, paddingBottom: 32 },
  title: { marginTop: 120, fontSize: 24, fontWeight: 500, color: AppTheme.primaryColor, textAlign: 'left' },
  subtitle: { marginTop: 12, fontSize: 18, fontWeight: 500, color: AppTheme.textPrimary, textAlign: 'left', marginBottom: 18 },
  inputTitle: { marginTop: 18, fontSize: 18, fontWeight: 500, color: AppTheme.textPrimary, textAlign: 'left' },
  inputBox: { marginTop: 8, fontSize: 16, color: AppTheme.textPrimary, height: 52, backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 24, paddingVertical: 15, },
  codeBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, height: 52, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 24, },
  codeBoxTight: { marginTop: 8 },
  codeInput: { flex: 1, height: 52, fontSize: 16, color: AppTheme.textPrimary, paddingVertical: 0, },
  codeBtnOff: { opacity: 0.45 },
  codeBtnText: { fontSize: 14, fontWeight: '500', color: AppTheme.primaryColor, },
  buttonDisabled: { opacity: 0.6 },
  agreement: { marginTop: 18 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkbox: { width: 13, height: 13, borderRadius: 10, borderWidth: 1, borderColor: '#999999', marginTop: 3, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: AppTheme.primaryColor, borderColor: AppTheme.primaryColor },
  checkboxMark: { fontSize: 10, lineHeight: 11, color: '#FFFFFF', fontWeight: '700' },
  agreementText: { flex: 1, fontWeight: 400, fontSize: 14, lineHeight: 20, color: '#999999' },
  agreementLink: { fontSize: 14, lineHeight: 20, color: AppTheme.primaryColor },
  button: { marginTop: 32, height: 48, backgroundColor: AppTheme.primaryColor, borderRadius: 16, },
  buttonText: { fontWeight: 500, fontSize: 18, color: "#FFFFFF" },
  registerText: { textAlign: 'center', marginTop: 18, fontWeight: 400, fontSize: 16, color: AppTheme.primaryColor, marginLeft: 4 },
  keyboardAccessory: {
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderTopWidth: 1,
    borderTopColor: 'rgba(102,102,102,0.29)'
  },
})

export default styles

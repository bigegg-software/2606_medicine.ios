import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  body: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 44, paddingBottom: 32 },
  logo: { width: 88, height: 88, alignSelf: 'center', marginBottom: 24, marginTop: 180 },
  title: { fontSize: 20, fontWeight: 'bold', color: AppTheme.primaryColor, textAlign: 'center', marginBottom: 40 },
  inputBox: { marginTop: 12, height: 52, fontSize: 16, color: AppTheme.textPrimary, backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 24, paddingVertical: 15, },
  codeBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, height: 52, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 24, },
  codeInput: { flex: 1, height: 52, fontSize: 16, color: AppTheme.textPrimary, paddingVertical: 0, },
  codeBtnOff: { opacity: 0.45 },
  codeBtnText: { fontSize: 14, fontWeight: '500', color: '#053A93', },
  buttonDisabled: { opacity: 0.6 },
  agreement: { marginTop: 18 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkbox: { width: 13, height: 13, borderRadius: 10, borderWidth: 1, borderColor: '#999999', marginTop: 3, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#053A93', borderColor: '#053A93' },
  checkboxMark: { fontSize: 10, lineHeight: 11, color: '#FFFFFF', fontWeight: '700' },
  agreementText: { flex: 1, fontWeight: 400, fontSize: 14, lineHeight: 20, color: '#999999' },
  agreementLink: { fontSize: 14, lineHeight: 20, color: '#053A93' },
  button: { marginTop: 32, height: 48, backgroundColor: "#053A93", borderRadius: 16, },
  buttonText: { fontWeight: 500, fontSize: 18, color: "#FFFFFF" },
  registerText: { textAlign: 'center', marginTop: 18, fontWeight: 400, fontSize: 16, color: "#053A93" },
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

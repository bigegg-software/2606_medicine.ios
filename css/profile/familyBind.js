import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  back: { padding: 16 },
  inviteBox: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: AppTheme.borderColor, borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: '#fff', fontSize: 16 },
  btn: { height: 48, backgroundColor: AppTheme.primaryColor, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});

export default styles;

import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A3A4A', alignItems: 'center', padding: 24 },
  back: { alignSelf: 'flex-start' },
  name: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 24 },
  timer: { fontSize: 56, fontWeight: '700', color: '#fff', marginVertical: 32 },
  target: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
  playBtn: { width: 88, height: 88, borderRadius: 44, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  actions: { position: 'absolute', bottom: 40, left: 24, right: 24, gap: 12 },
  doneBtn: { height: 56, backgroundColor: AppTheme.primaryColor, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  skipBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
});

export default styles;

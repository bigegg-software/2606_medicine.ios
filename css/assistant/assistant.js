import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: AppTheme.borderColor },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppTheme.textPrimary },
  headerSub: { fontSize: 14, color: AppTheme.textSecondary },
  list: { padding: 16, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${AppTheme.primaryColor}20`, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleAi: { backgroundColor: '#fff', borderWidth: 1, borderColor: AppTheme.borderColor },
  bubbleUser: { backgroundColor: AppTheme.primaryColor },
  bubbleText: { fontSize: 16, color: AppTheme.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  time: { fontSize: 11, color: AppTheme.textSecondary, marginTop: 6, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: AppTheme.borderColor },
  input: { flex: 1, minHeight: 44, maxHeight: 100, borderWidth: 1, borderColor: AppTheme.borderColor, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, backgroundColor: AppTheme.backgroundColor },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center' },
});

export default styles;

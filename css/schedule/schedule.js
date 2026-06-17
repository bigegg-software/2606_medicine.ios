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
  glassCardWrap: {
    borderRadius: 18,
    shadowColor: '#B4C9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  glassCard: {
    height: 184,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8FAFF',
  },
  glassCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  glassCardTitle: {
    fontWeight: 500,
    fontSize: 18,
    color: AppTheme.textPrimary,
  },
  statusBox: {
    backgroundColor: 'rgba(52,182,159,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  statusText: {
    fontWeight: 500,
    fontSize: 12,
    color: '#34B69F',
  },
  milestoneRingsBox: {
    width: 99,
    height: 99,
  },
})

export default styles

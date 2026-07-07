import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  body: { padding: 18, paddingBottom: 40 },
  weekNavBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#0C3D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 18,
  },
  navIcon: { width: 24, height: 24 },
  navIconRight: { width: 24, height: 24, transform: [{ rotate: '180deg' }] },
  navIconDisabled: { opacity: 0.3 },
  weekRangeText: {
    flex: 1,
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.textPrimary,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 14,
    fontWeight: 500,
    fontSize: 18,
    color: '#333333',
  },
  detailCard: {
    marginBottom: 12,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  detailTitle: { fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary },
  detailMeta: { marginTop: 6, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
  detailProgress: { marginTop: 4, fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor },
  emptyText: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
  loadingBox: { paddingVertical: 24, alignItems: 'center' },
});

export default styles;

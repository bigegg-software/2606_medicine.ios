import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  body: { padding: 18, paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  prescriptionTitle: {
    flex: 1,
    fontWeight: 500,
    fontSize: 18,
    color: AppTheme.textPrimary,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,153,38,0.14)',
  },
  statusBadgeEnded: {
    backgroundColor: 'rgba(5,58,147,0.12)',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(52,182,159,0.14)',
  },
  statusBadgeText: {
    fontWeight: 500,
    fontSize: 12,
    color: '#FF9926',
  },
  statusBadgeTextEnded: {
    color: AppTheme.primaryColor,
  },
  statusBadgeTextActive: {
    color: '#34B69F',
  },
  doctorText: {
    marginTop: 12,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  cycleText: {
    marginTop: 8,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textPrimary,
  },
  metaText: {
    marginTop: 8,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  progressRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5,58,147,0.08)',
  },
  progressLabel: {
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  progressRing: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCanvas: {
    width: 48,
    height: 48,
    position: 'absolute',
  },
  progressText: {
    fontWeight: 500,
    fontSize: 12,
    color: AppTheme.primaryColor,
  },
  remarkText: {
    marginTop: 12,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 500,
    fontSize: 18,
    color: AppTheme.textPrimary,
  },
  sectionAction: {
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.primaryColor,
  },
  taskCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  taskTitle: {
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.textPrimary,
  },
  taskDuration: {
    fontWeight: 500,
    fontSize: 14,
    color: AppTheme.primaryColor,
  },
  taskIntro: {
    marginTop: 8,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 21,
  },
  taskProjects: {
    marginTop: 6,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textPrimary,
    lineHeight: 21,
  },
  taskFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5,58,147,0.08)',
  },
  taskRatio: {
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  taskCompletion: {
    fontWeight: 500,
    fontSize: 14,
    color: AppTheme.primaryColor,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  statValue: {
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.primaryColor,
  },
  statTitle: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textPrimary,
  },
  pauseCard: {
    marginTop: 16,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,153,38,0.2)',
  },
  pauseTitle: {
    fontWeight: 500,
    fontSize: 16,
    color: '#FF9926',
  },
  pauseMeta: {
    marginTop: 8,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textPrimary,
    lineHeight: 22,
  },
  pauseNote: {
    marginTop: 10,
    fontWeight: 400,
    fontSize: 12,
    color: AppTheme.textSecondary,
    lineHeight: 18,
  },
  emptyText: {
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;

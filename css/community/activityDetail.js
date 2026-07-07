import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const cardShadow = {
  shadowColor: '#053A93',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 120 },
  heroWrap: {
    position: 'relative',
    width: '100%',
    height: 240,
    backgroundColor: '#D9E6FF',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroStatusTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: -28,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    ...cardShadow,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AppTheme.textPrimary,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(79,134,238,0.12)',
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#4F86EE',
    fontWeight: '500',
  },
  signupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#00C950',
  },
  signupBadgePending: {
    backgroundColor: 'rgba(5,58,147,0.08)',
  },
  signupBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signupBadgeTextPending: {
    color: AppTheme.primaryColor,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    ...cardShadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(5,58,147,0.08)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(5,58,147,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: AppTheme.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: AppTheme.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  mapLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(5,58,147,0.06)',
  },
  mapLinkText: {
    fontSize: 12,
    color: AppTheme.primaryColor,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    ...cardShadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: AppTheme.primaryColor,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppTheme.textPrimary,
  },
  sectionSubBlock: {
    marginTop: 14,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(79,134,238,0.35)',
  },
  sectionSubTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AppTheme.textPrimary,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 22,
  },
  detailLine: {
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 22,
    marginTop: 6,
  },
  signupStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  signupStat: {
    fontSize: 28,
    fontWeight: '700',
    color: AppTheme.primaryColor,
    lineHeight: 32,
  },
  signupStatUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: AppTheme.textSecondary,
    marginBottom: 4,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(5,58,147,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: AppTheme.primaryColor,
  },
  signupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  signupMeta: {
    fontSize: 13,
    color: AppTheme.textSecondary,
    lineHeight: 20,
  },
  signupStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,201,80,0.12)',
  },
  signupStatusPillPending: {
    backgroundColor: 'rgba(5,58,147,0.08)',
  },
  signupStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A63E',
  },
  signupStatusTextPending: {
    color: AppTheme.primaryColor,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(5,58,147,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.textPrimary,
  },
  organizerPhone: {
    marginTop: 4,
    fontSize: 14,
    color: AppTheme.primaryColor,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(5,58,147,0.08)',
    ...cardShadow,
  },
  btn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: AppTheme.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(5,58,147,0.18)',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  btnCancelText: {
    color: AppTheme.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
});

export default styles;

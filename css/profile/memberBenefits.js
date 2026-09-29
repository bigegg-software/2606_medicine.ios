import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.backgroundColor,
  },
  scroll: {
    padding: 12,
    paddingBottom: 24,
  },
  bottomBar: {
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 17,
    backgroundColor: '#FEFEFE',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#B4C9FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomBarButton: {
    flex: 1,
    height: 46,
    backgroundColor: '#6D925E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  bottomBarButtonIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  bottomBarButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  hero: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 96,
  },
  heroInner: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
  },
  heroTextWrap: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  heroLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: '#333333',
  },
  heroStatus: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
  },
  heroIcon: {
    width: 63,
    height: 63,
    flexShrink: 0,
  },
  section: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#0C3D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 4,
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    color: AppTheme.textPrimary,
  },
  infoRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5,58,147,0.06)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999999',
  },
  infoValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
  },
  benefitCard: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 21,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  benefitTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  benefitMetaLabel: {
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  benefitMetaValue: {
    marginTop: -2,
    fontWeight: '500',
    fontSize: 19,
  },
  benefitTotalRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  benefitUnlimitedTip: {
    marginTop: 16,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  benefitProgressTrack: {
    marginTop: 14,
    height: 5,
    borderRadius: 6,
    backgroundColor: '#ECF3FF',
    overflow: 'hidden',
  },
  benefitProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
});

export default styles;

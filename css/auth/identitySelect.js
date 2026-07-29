import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    width: '100%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#6D925E',
  },
  subtitle: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 15,
    color: '#6D925E',
    marginBottom: 12,
  },
  optionBtn: {
    marginTop: 16,
    height: 114,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  optionBtnDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 45,
    height: 45,
    marginRight: 20,
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionBadge: {
    marginRight: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  optionBadgeElder: {
    backgroundColor: 'rgba(238,156,68,0.06)',
    borderColor: 'rgba(238,156,68,0.3)',
  },
  optionBadgeText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#6D925E',
  },
  optionBadgeTextElder: {
    color: '#EE9C44',
  },
  optionText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#000000',
  },
  optionDesc: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  warnBar: {
    width: '100%',
    paddingBottom: 24,
  },
  warnIcon: {
    width: 13,
    height: 13,
    marginRight: 4,
  },
  warnText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  warnTextLink: {
    color: '#6D925E',
  },
});

export default styles;

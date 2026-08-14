import { Dimensions, StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  sheetHost: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    shadowOpacity: 0,
    elevation: 0,
  },
  wrap: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  hero: {
    width: 118,
    height: 125,
    position: 'absolute',
    top: -63,
    left: '50%',
    marginLeft: -59,
    zIndex: 2,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'visible',
  },
  topImg: {
    width: width - 66,
    height: ((width - 66) * 17) / 310,
  },
  title: {
    marginTop: 48,
    marginBottom: 4,
    fontWeight: '700',
    fontSize: 18,
    color: AppTheme.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
  },
  scroll: {
    width: '100%',
    maxHeight: 360,
    alignSelf: 'stretch',
  },
  scrollContent: {
    paddingBottom: 8,
    paddingRight: 4,
  },
  desc: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'left',
    width: '100%',
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    width: '100%',
    textAlign: 'left',
  },
  bullet: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'left',
    width: '100%',
  },
  btnRow: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 25,
    backgroundColor: '#F6F8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  confirmBtnWrap: {
    flex: 1,
    height: 44,
    borderRadius: 25,
  },
  confirmBtn: {
    width: '100%',
    height: 44,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default styles;

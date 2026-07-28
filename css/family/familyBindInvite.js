import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';
import baseStyles from '@/css/profile/myFamilyAdd';

const extraStyles = StyleSheet.create({
  bottomBarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomBarButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  bottomBarButtonReject: {
    borderWidth: 1,
    borderColor: '#FB4550',
    backgroundColor: '#FFFFFF',
  },
  bottomBarButtonAccept: {
    backgroundColor: AppTheme.primaryColor,
  },
  bottomBarButtonTextReject: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FB4550',
  },
  bottomBarButtonTextAccept: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  formReadonlyValue: {
    flex: 1,
    marginLeft: 16,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
  },
});

const styles = {
  ...baseStyles,
  ...extraStyles,
};

export default styles;

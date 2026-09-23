import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  sheetOuter: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5E5',
    marginBottom: 14,
  },
  header: {
    minHeight: 28,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginLeft: 28,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  tip: {
    marginTop: 13,
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
    textAlign: 'center',
  },
  inputBox: {
    marginTop: 16,
    backgroundColor: '#F6F8FB',
    borderRadius: 9,
    padding: 13,
    minHeight: 148,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  inputBoxError: {
    borderColor: 'rgba(224, 85, 85, 0.55)',
    backgroundColor: '#FFF8F8',
  },
  input: {
    flexGrow: 1,
    minHeight: 88,
    padding: 0,
    margin: 0,
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
    textAlignVertical: 'top',
  },
  inputFooter: {
    marginTop: 10,
  },
  countText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  countTextFull: {
    color: '#E05555',
  },
  micWrap: {
    width: 28,
    height: 28,
    overflow: 'visible',
  },
  errorTip: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 13,
    color: '#E05555',
    textAlign: 'left',
  },
  errorTipPlaceholder: {
    height: 21,
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 27,
    overflow: 'hidden',
  },
  saveBtnIdle: {
    opacity: 0.95,
  },
  saveBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});

export default styles;

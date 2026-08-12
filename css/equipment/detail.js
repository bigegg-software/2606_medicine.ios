import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  content: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroImage: {
    width: 214,
    height: 214,
  },
  card: {
    marginTop: 20,
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FEFFFF',
    borderRadius: 12,
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: 'rgba(23,63,125,0.08)',
  },
  rowLabel: {
    fontWeight: '400',
    fontSize: 14,
    color: '#333333',
  },
  rowValue: {
    fontWeight: '400',
    fontSize: 14,
    color: '#999999',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotOn: {
    backgroundColor: '#39BF56',
  },
  statusDotOff: {
    backgroundColor: '#CBCBCB',
  },
  tipCard: {
    marginTop: 12,
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  tipIcon: {
    width: 15,
    height: 15,
    marginRight: 5,
  },
  tipTitle: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  tipDesc: {
    marginTop: 6,
    fontWeight: '400',
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  bottomBar: {
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 12,
    backgroundColor: '#FEFEFE',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#B4C9FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteBtn: {
    flex: 1,
    height: 46,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  deleteBtnIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  deleteBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6D925E',
  },
  actionBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#6D925E',
    borderRadius: 12,
  },
  actionBtnIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  actionBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default styles;

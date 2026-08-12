import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  content: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  contentIdle: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentFound: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  contentModule: {
    width: '100%',
    alignItems: 'center',
  },
  searchHero: {
    alignItems: 'center',
  },
  searchLottie: {
    width: 80,
    height: 80,
  },
  searchIcon: {
    width: 80,
    height: 80,
  },
  searchingText: {
    marginTop: 25,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  tipBox: {
    marginTop: 25,
    alignSelf: 'center',
  },
  tipText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#666666',
    lineHeight: 28,
    textAlign: 'left',
  },
  tipHighlight: {
    fontWeight: '400',
    fontSize: 14,
    color: '#333333',
    lineHeight: 28,
  },

  foundModule: {
    width: '100%',
  },
  foundHeader: {
    marginTop: 15,
    marginBottom: 12,
  },
  foundTitle: {
    fontWeight: '500',
    fontSize: 16,
    color: '#333333',
  },
  researchBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  researchBtnIcon: {
    width: 12,
    height: 12,
    marginRight: 6,
  },
  researchBtnText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#6D925E',
  },
  foundList: {
    width: '100%',
  },
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  foundLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  foundInfo: {
    flex: 1,
    minWidth: 0,
  },
  foundName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  foundId: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  connectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#6D925E',
    borderRadius: 25,
    marginLeft: 8,
  },
  connectBtnIcon: {
    width: 12,
    height: 12,
    marginRight: 3,
  },
  connectBtnText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#FFFFFF',
  },
});

export default styles;

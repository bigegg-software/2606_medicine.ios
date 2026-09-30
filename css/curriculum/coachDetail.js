import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollFlex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 21,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    alignItems: 'center',
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: 40,
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: {
    marginLeft: 13,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  stationRow: {
    marginTop: 10,
    marginLeft: 13,
    alignItems: 'center',
  },
  stationIcon: {
    width: 13,
    height: 13,
    marginRight: 4,
    flexShrink: 0,
  },
  stationText: {
    flex: 1,
    minWidth: 0,
    fontWeight: '400',
    fontSize: 14,
    color: '#666666',
  },
  certCard: {
    marginTop: 21,
    paddingVertical: 16,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(109, 146, 94, 0.1)',
    borderRadius: 6,
  },
  certIcon: {
    width: 13,
    height: 13,
    flexShrink: 0,
  },
  certLabel: {
    marginLeft: 5,
    flexShrink: 0,
    fontWeight: '400',
    fontSize: 15,
    color: '#333333',
  },
  certValue: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    textAlign: 'right',
    fontWeight: '400',
    fontSize: 15,
    color: '#333333',
  },
  sectionTitleRow: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleBar: {
    width: 4,
    height: 15,
    marginRight: 6,
    backgroundColor: '#6D925E',
    borderRadius: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.textPrimary,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
    color: AppTheme.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
});

export default styles;

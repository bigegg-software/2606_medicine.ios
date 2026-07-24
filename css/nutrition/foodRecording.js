import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { paddingTop: 8, paddingBottom: 40, flex: 1 },
  topBox: {
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  navBox: {
    height: 40,
    padding: 3,
    backgroundColor: '#EDEEEF',
    borderRadius: 25,
    gap: 6,
  },
  navItem: {
    flex: 1,
    height: 34,
    borderRadius: 25,
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
  },
  navItemInactive: {
    borderRadius: 50,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  navIcon: {
    width: 18,
    height: 18,
    marginRight: 3,
  },
  navText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  navTextActive: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  backImage1: { width: "100%", height: 50 },
  backImage1Text: { fontWeight: "bold", fontSize: 16, color: "#333333" },
  tabBox: { width: 106, height: 26, gap: 6, padding: 3, borderRadius: 13, backgroundColor: "#EDEEEF" },
  tabItem: { flex: 1, height: "100%" },
  tabItemActive: { flex: 1, height: "100%", backgroundColor: "#FFFFFF", borderRadius: 25 },
  tabItemText: { fontWeight: 500, fontSize: 11, color: "#333333" },
  tabItemTextActive: { fontWeight: 'bold', fontSize: 11, color: '#333333' },
  rateBox: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rateItem: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  rateItemTitle: {
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
  },
  rateItemValue: {
    marginTop: 6,
    fontWeight: 'bold',
    fontSize: 25,
    color: '#333333',
  },
  rateTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  rateTagOk: {
    borderColor: '#6D925E',
  },
  rateTagWarn: {
    borderColor: '#EE9C44',
  },
  rateTagBad: {
    borderColor: '#FB4550',
  },
  rateTagText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  rateTagTextOk: {
    color: '#6D925E',
  },
  rateTagTextWarn: {
    color: '#EE9C44',
  },
  rateTagTextBad: {
    color: '#FB4550',
  },
  trendSection: {
    marginHorizontal: 12,
    padding: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'visible',
  },
  legendRow: {
    marginTop: 30,
    marginHorizontal: 12,
    gap: 12,
  },
  legendItem: {
    marginRight: 12,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
  },
  baselineHint: {

    position: "absolute",
    bottom: 10,
    zIndex:99,
    left: 0,
    right: 0,
    marginTop: 8,
    marginHorizontal: 12,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 11,
    color: '#8A8A8E',
  },
  chartWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  chartSliderTrack: {
    position: 'absolute',
    left: 0,
    zIndex: 20,
  },
  chartSliderThumb: {
    position: 'absolute',
  },
  selectionCard: {
    position: 'absolute',
    top: 8,
    zIndex: 30,
    minWidth: 112,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(23,63,125,0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectionCardTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333333',
    marginBottom: 2,
  },
  selectionCardRow: {
    marginTop: 6,
  },
  selectionCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  selectionCardLabel: {
    fontWeight: '500',
    fontSize: 11,
    color: '#666666',
    marginRight: 8,
  },
  selectionCardValue: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#333333',
  },
  trendChart: {
    width: '100%',
    height: 210,
  },
  trendEmpty: {
    marginTop: 10,
    marginHorizontal: 12,
    height: 190,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendEmptyText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  detailBox: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  monthTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  monthHeader: {
    minHeight: 28,
  },
  monthCount: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#999999',
  },
  monthIcon: {
    width: 16,
    height: 16,
    marginLeft: 12,
  },
  dayItem: {
    height: 81,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,63,125,0.08)',
  },
  dayItemLast: {
    borderBottomWidth: 0,
  },
  dayIcon: {
    width: 45,
    height: 45,
  },
  dayInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  daySubtitle: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  dayRightIcon: {
    width: 5,
    height: 9,
    marginLeft: 12,
  },
  detailFooterText: {
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 12,
    color: '#999999',
  },
  detailLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default styles;

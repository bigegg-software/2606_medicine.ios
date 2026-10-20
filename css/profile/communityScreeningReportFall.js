import { StyleSheet } from 'react-native';

/** 防跌倒初筛报告详情样式（在 pilates 共用样式基础上补充） */
const styles = StyleSheet.create({
  emptyTip: {
    marginTop: 80,
    textAlign: 'center',
    fontSize: 14,
    color: '#999999',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskLevelText: {
    flex: 1,
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 15,
    color: '#E85D4C',
    lineHeight: 22,
  },
  riskDotAccent: {
    backgroundColor: '#E85D4C',
  },
  riskDot: {
    width: 5,
    height: 5,
    marginTop: 6,
    backgroundColor: '#6D925E',
    borderRadius: 5,
    flexShrink: 0,
  },
  riskPointLabel: {
    fontWeight: '400',
    fontSize: 13,
    color: '#333333',
  },
  riskPointValue: {
    fontWeight: '400',
    fontSize: 13,
    color: '#666666',
  },
  subValue: {
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  itemTableHeader: {
    width: '100%',
  },
  itemTableHeaderText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
  },
  itemRow: {
    width: '100%',
    paddingVertical: 12,
  },
  itemRowTotal: {
    backgroundColor: '#F6F8FB',
    marginHorizontal: -13,
    paddingHorizontal: 13,
    borderRadius: 8,
  },
  itemColName: {
    width: '32%',
    minWidth: 0,
    paddingRight: 4,
    overflow: 'hidden',
  },
  itemColResult: {
    width: '20%',
    minWidth: 0,
    paddingRight: 4,
  },
  itemColScore: {
    width: '14%',
    textAlign: 'center',
    flexShrink: 0,
  },
  itemColWeight: {
    width: '14%',
    flexShrink: 0,
    alignItems: 'center',
  },
  itemColWeighted: {
    width: '20%',
    textAlign: 'center',
    flexShrink: 0,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333333',
  },
  itemSubtitle: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 11,
    color: '#999999',
  },
  itemBarTrack: {
    marginTop: 6,
    width: '100%',
    maxWidth: '100%',
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 535,
    overflow: 'hidden',
  },
  itemBarFill: {
    height: 4,
    backgroundColor: '#DBDBDB',
    borderRadius: 535,
  },
  itemResultLabel: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
    lineHeight: 18,
  },
  itemResultNum: {
    fontWeight: '500',
    fontSize: 16,
    color: '#6D925E',
    lineHeight: 18,
  },
  itemWeightX: {
    fontWeight: '500',
    fontSize: 11,
    color: '#999999',
  },
  itemWeightNum: {
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  itemScoreText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  refTableHeader: {
    width: '100%',
    gap: 8,
  },
  refRow: {
    width: '100%',
    paddingVertical: 10,
    gap: 8,
  },
  refColLevel: {
    width: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refColCriteria: {
    width: 100,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refColAction: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refColActionTitle: {
    textAlign: 'center',
  },
  refLevelText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    width: '100%',
  },
  refCriteriaText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    textAlign: 'center',
    width: '100%',
  },
  refActionText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    textAlign: 'center',
    width: '100%',
  },
  bannerTag: {
    alignSelf: 'flex-start',
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  bannerTagText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#6D925E',
  },
  metaText: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
});

export default styles;

import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.backgroundColor,
  },
  pageBody: {
    flex: 1,
  },
  body: {
    padding: 18,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTitle: {
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.textPrimary,
  },
  cardSubTitle: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: AppTheme.textSecondary,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 500,
    fontSize: 18,
    color: AppTheme.textPrimary,
  },
  statGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '30%',
    backgroundColor: 'rgba(79,134,238,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statLabel: {
    fontWeight: 400,
    fontSize: 12,
    color: AppTheme.textSecondary,
  },
  statValue: {
    marginTop: 6,
    fontWeight: 600,
    fontSize: 18,
    color: AppTheme.textPrimary,
  },
  statHint: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: '#34B69F',
  },
  sliderContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(79,134,238,0.14)',
    borderRadius: 45,
    padding: 4,
    position: 'relative',
  },
  sliderIndicator: {
    position: 'absolute',
    width: 48,
    height: 23,
    borderRadius: 45,
    backgroundColor: '#173F7D',
    top: 4,
  },
  sliderBtn: {
    width: 48,
    height: 23,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sliderTextActive: {
    fontWeight: 500,
    fontSize: 12,
    color: '#FFFFFF',
  },
  sliderTextInactive: {
    fontWeight: 400,
    fontSize: 12,
    color: '#173F7D',
  },
  trendCard: {
    marginTop: 0,
  },
  chartLoading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  legendRow: {
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    marginRight: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontWeight: 400,
    fontSize: 12,
    color: AppTheme.textSecondary,
  },
  chartWrap: {
    marginTop: 8,
  },
  trendChart: {
    width: '100%',
    height: 168,
  },
  chartLabels: {
    marginTop: 4,
    position: 'relative',
    height: 16,
  },
  chartLabelText: {
    position: 'absolute',
    width: 36,
    marginLeft: -18,
    textAlign: 'center',
    fontWeight: 400,
    fontSize: 10,
    color: AppTheme.textSecondary,
  },
  baselineHint: {
    marginTop: 8,
    fontWeight: 400,
    fontSize: 11,
    color: AppTheme.textSecondary,
  },
  tabBox: {
    marginTop: 8,
    marginHorizontal: 18,
    paddingBottom: 0,
  },
  tabCol: {
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  tabItemWrap: {
    position: 'relative',
    alignItems: 'center',
    paddingBottom: 12,
  },
  tabText: {
    fontWeight: 400,
    fontSize: 16,
    color: '#999999',
    lineHeight: 22,
  },
  activeTabText: {
    color: AppTheme.primaryColor,
    fontWeight: 500,
    fontSize: 18,
    lineHeight: 24,
  },
  tabIndicatorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: 'center',
  },
  tabIndicator: {
    width: 34,
    height: 10,
  },
  trendEmpty: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendEmptyText: {
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  monthTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.textPrimary,
  },
  dayItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,63,125,0.06)',
  },
  dayTitle: {
    fontWeight: 500,
    fontSize: 16,
    color: AppTheme.textPrimary,
  },
  daySubtitle: {
    marginTop: 6,
    fontWeight: 400,
    fontSize: 13,
    color: AppTheme.textSecondary,
  },
  dayComplianceText: {
    fontWeight: 500,
    fontSize: 13,
    marginRight: 6,
  },
  dayArrow: {
    fontWeight: 400,
    fontSize: 16,
    color: AppTheme.textSecondary,
  },
  dateText: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 13,
    color: AppTheme.textSecondary,
  },
  nutritionCard: {
    marginTop: 12,
  },
  nutritionGoalCard: {
    margin: 12,
    backgroundColor: '#FEFFFF',
    borderRadius: 12,
    padding: 12,
  },
  nutritionGoalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  nutritionGoalGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionGoalItem: {
    width: '47%',
    flexGrow: 1,
    height: 79,
    backgroundColor: '#F6F8FB',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  nutritionGoalIcon: {
    width: 18,
    height: 18,
  },
  nutritionGoalItemTitle: {
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 13,
  },
  nutritionGoalStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  nutritionGoalStatus: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  backImage1: { width: "100%", height: 50, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  backImage1Text: { fontWeight: "bold", fontSize: 16, color: "#333333" },
  mealDetailCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FEFFFF',
  },
  mealDetailCardFirst: {
    marginTop: 0,
  },
  mealDetailHeaderIcon: {
    width: 15,
    height: 15,
  },
  mealDetailHeaderTitle: {
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  mealDetailHeaderValue: {
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333333',
  },
  mealDetailHeaderTarget: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#999999',
  },
  mealDetailHeaderUnit: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  mealDetailFoodRow: {
    height: 45,
    marginTop:20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealDetailFoodImage: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: '#F3F6FB',
  },
  mealDetailFoodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealDetailFoodName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  mealDetailFoodServing: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  mealDetailFoodCalorie: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  mealDetailFoodArrow: {
    width: 5,
    height: 9,
    marginLeft: 5,
  },
  nutritionGoalValueRow: {
    marginTop: 8,
  },
  nutritionGoalValue: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333333',
  },
  nutritionGoalTarget: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#999999',
  },
  nutritionGoalUnit: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  nutritionGoalBarTrack: {
    marginTop: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  nutritionGoalBarFill: {
    height: 5,
    borderRadius: 3,
  },
  nutritionRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '31%',
  },
  nutritionTitle: {
    fontWeight: 500,
    fontSize: 12,
    color: '#666666',
  },
  nutritionValue: {
    marginTop: 8,
    fontWeight: 500,
    fontSize: 12,
    color: '#333333',
  },
  nutritionUnit: {
    fontWeight: 500,
    fontSize: 12,
    color: '#666666',
  },
  statusText: {
    marginTop: 6,
    fontWeight: 500,
    fontSize: 12,
  },
  statusIcon: {
    width: 14,
    height: 14,
    marginLeft: 2,
  },
  mealSection: {
    marginTop: 12,
  },
  mealSectionHeader: {
    marginBottom: 10,
    fontWeight: 500,
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,63,125,0.06)',
  },
  foodImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F6FB',
  },
  foodImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F6FB',
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  foodName: {
    fontWeight: 500,
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  foodServing: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: AppTheme.textSecondary,
  },
  foodCalorie: {
    fontWeight: 500,
    fontSize: 14,
    color: '#FF8B07',
  },
  waterHeader: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,63,125,0.06)',
  },
  waterTime: {
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  waterAmount: {
    fontWeight: 500,
    fontSize: 14,
    color: AppTheme.textPrimary,
  },
});

export default styles;

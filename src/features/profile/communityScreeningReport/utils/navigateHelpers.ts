import type { CommunityScreenReportType } from '@/api/communityScreenReport';
import { COMMUNITY_SCREEN_REPORT_TYPE } from '@/api/communityScreenReport';

export function getCommunityScreenReportDetailRoute(
  reportType?: CommunityScreenReportType | null,
): 'CommunityScreeningReportFallDetail' | 'CommunityScreeningReportPilatesDetail' {
  if (reportType === COMMUNITY_SCREEN_REPORT_TYPE.fallPrevention) {
    return 'CommunityScreeningReportFallDetail';
  }
  return 'CommunityScreeningReportPilatesDetail';
}

export function isFallPreventionReportType(reportType?: CommunityScreenReportType | null): boolean {
  return reportType === COMMUNITY_SCREEN_REPORT_TYPE.fallPrevention;
}

export function isPilatesReportType(reportType?: CommunityScreenReportType | null): boolean {
  return reportType === COMMUNITY_SCREEN_REPORT_TYPE.pilates;
}

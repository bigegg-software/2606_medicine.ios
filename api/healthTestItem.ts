import request from '@/utils/axios';
import type { HealthTestItemVo } from './healthGoal';

export type HealthTestItemInfo = HealthTestItemVo;

export const getHealthTestItemInfo = (healthTestItemId: string | number) =>
  request.get<{ code?: number; data?: HealthTestItemInfo }>('/patient/healthTestItem/getInfo', {
    params: { healthTestItemId },
  });

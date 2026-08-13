import type { InUseExPatientRule } from '@/api/schedule';
import { performExerciseDailySign } from './exerciseSignHelpers';

let checkInInFlight = false;

/** 运动页右侧「戳我打卡」：与训练页「完成今日打卡」同一套逻辑 */
export async function onPressExerciseCheckInFab(
  exerciseRule?: InUseExPatientRule | null,
) {
  if (checkInInFlight) return;
  checkInInFlight = true;
  try {
    await performExerciseDailySign({
      isToday: true,
      autoLoadEligibility: true,
      exerciseRule: exerciseRule ?? null,
    });
  } finally {
    checkInInFlight = false;
  }
}

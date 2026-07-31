import type { UserBaseInfo } from '@/api/patient';

/** 营养等相关场景：基本信息是否已完善（含运动水平） */
export function isUserBaseInfoComplete(user?: UserBaseInfo | null): boolean {
  if (!user) return false;
  const height = Number(user.height);
  const weight = Number(user.weight);
  return Boolean(
    user.name?.trim() &&
      user.gender?.trim() &&
      user.birthDate?.trim() &&
      Number.isFinite(height) &&
      height > 0 &&
      Number.isFinite(weight) &&
      weight > 0 &&
      String(user.dailyActivityLevel ?? '').trim(),
  );
}

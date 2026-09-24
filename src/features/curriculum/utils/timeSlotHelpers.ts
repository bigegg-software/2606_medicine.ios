export type TimeSlotValue = {
  /** 展示文案，如 09:00-10:00 */
  label: string;
  startTime: string;
  endTime: string;
};

const SLOT_START_HOUR = 9;
const SLOT_END_HOUR = 21;

function padHour(hour: number) {
  return `${hour < 10 ? '0' : ''}${hour}:00`;
}

/** 09:00–21:00 整点 60 分钟共 12 段 */
export function buildHourlyTimeSlots(): TimeSlotValue[] {
  const slots: TimeSlotValue[] = [];
  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour += 1) {
    const startTime = padHour(hour);
    const endTime = padHour(hour + 1);
    slots.push({
      label: `${startTime}-${endTime}`,
      startTime,
      endTime,
    });
  }
  return slots;
}

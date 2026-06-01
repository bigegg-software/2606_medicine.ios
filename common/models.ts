export interface HealthMetricModel {
  type: string;
  value: string;
  recordedAt: string;
}

export function parseHealthMetric(raw: Record<string, unknown>): HealthMetricModel {
  return {
    type: String(raw.type ?? ''),
    value: String(raw.value ?? ''),
    recordedAt: String(raw.recordedAt ?? new Date().toISOString()),
  };
}

export function parseHealthMetrics(data: unknown): HealthMetricModel[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map(parseHealthMetric);
  }
  if (typeof data === 'object') {
    const parsed: HealthMetricModel[] = [];
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        parsed.push(parseHealthMetric({ type: key, ...(value as Record<string, unknown>) }));
      }
    });
    return parsed;
  }
  return [];
}

export interface ScheduleItem {
  id?: number | string;
  title?: string;
  type?: string;
  status?: string;
  scheduledTime?: string;
}

export interface ActivityItem {
  id?: number | string;
  title?: string;
  location?: string;
  typeLabel?: string;
  startTime?: string;
}

export interface UserProfile {
  nickname?: string;
  name?: string;
  points?: number;
  phone?: string;
  mobile?: string;
  [key: string]: unknown;
}

export interface TrainingExerciseParam {
  id: number;
  name: string;
  description?: string;
  durationMinutes?: number;
  targetCount?: number;
  unit?: string;
  videoUrl?: string;
}

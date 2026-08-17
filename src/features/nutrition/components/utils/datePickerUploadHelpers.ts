import {
  getMeasureDataIsUploadByDateRange,
  type MeasureIsUploadByDateItem,
} from '@/api/measureData';
import {
  getWearableDataIsUploadByDateRange,
  type WearableIsUploadByDateItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import moment from 'moment';

export type DatePickerUploadMarker = {
  source: 'wearable' | 'measure';
  type: string;
  color: string;
};

/** dateKey(yyyy-MM-dd) → 当日是否有上传 */
export type DatePickerUploadMap = Record<string, boolean>;

function getUploadYearRange(year: number, today = moment()) {
  if (!Number.isFinite(year)) return null;
  if (year > today.year()) return null;
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

function applyUploadExists(
  map: DatePickerUploadMap,
  items: Array<WearableIsUploadByDateItem | MeasureIsUploadByDateItem> | undefined,
) {
  (items ?? []).forEach(item => {
    const date = item.customerLocalDate?.trim();
    if (!date) return;
    map[date] = Boolean(item.exists);
  });
}

async function loadUploadMarkerMapByDateRange(
  marker: Pick<DatePickerUploadMarker, 'source' | 'type'>,
  startDate: string,
  endDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<DatePickerUploadMap> {
  const map: DatePickerUploadMap = {};
  try {
    const res =
      marker.source === 'wearable'
        ? await getWearableDataIsUploadByDateRange({
            type: marker.type,
            startDate,
            endDate,
          }, options)
        : await getMeasureDataIsUploadByDateRange({
            type: marker.type,
            startDate,
            endDate,
          }, options);

    if (isResourceApiOk(res as unknown as { code?: number })) {
      applyUploadExists(
        map,
        apiResourceData<Array<WearableIsUploadByDateItem | MeasureIsUploadByDateItem>>(
          res as unknown as {
            code?: number;
            data?: Array<WearableIsUploadByDateItem | MeasureIsUploadByDateItem>;
          },
        ),
      );
    }
  } catch {
    /* ignore */
  }
  return map;
}

/** 按年懒加载上传标记（未来年直接跳过） */
export async function loadUploadMarkerMapByYear(
  marker: Pick<DatePickerUploadMarker, 'source' | 'type'>,
  year: number,
  options?: { patientUserId?: string | number | null },
): Promise<DatePickerUploadMap | null> {
  const range = getUploadYearRange(year);
  if (!range) return null;
  return loadUploadMarkerMapByDateRange(marker, range.startDate, range.endDate, options);
}

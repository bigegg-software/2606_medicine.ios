import React from 'react';
import { Text } from 'react-native';
import { Modal, Toast } from '@ant-design/react-native';
import moment from 'moment';
import type { CourseSessionType } from '@/api/courseSession';
import type { SystemUser } from '@/api/user';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export type BookingDialogInfo = {
  courseName: string;
  coachName: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  stationName?: string;
};

export function bookingInfoFromDetail(detail: {
  title: string;
  coachName: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  stationName?: string;
}): BookingDialogInfo {
  return {
    courseName: detail.title?.trim() || '课程',
    coachName: detail.coachName?.trim() || '教练',
    sessionDate: detail.sessionDate?.trim() || '',
    startTime: detail.startTime?.trim() || '',
    endTime: detail.endTime?.trim() || '',
    stationName: detail.stationName?.trim() || '门店',
  };
}

function formatHm(time?: string) {
  const raw = time?.trim() || '';
  if (!raw) return '';
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

/** 私教课 / 集体课 / 线上课 */
export function courseTypeBenefitLabel(courseType: CourseSessionType | string) {
  if (courseType === 'group') return '集体课';
  if (courseType === 'online') return '线上课';
  return '私教课';
}

/** 读取对应课型剩余次数；-1 不限；缺省 null */
export function resolveCourseBenefitRemainCount(
  user: SystemUser | null | undefined,
  courseType: CourseSessionType | string,
): number | null {
  const raw =
    courseType === 'group'
      ? user?.groupClassTotalCount
      : courseType === 'online'
        ? user?.onlineClassTotalCount
        : user?.privateCoachTotalCount;
  if (raw == null || Number.isNaN(Number(raw))) return null;
  return Number(raw);
}

/** 已知剩余次数且不足时拦截预约（null / -1 不拦截，交给接口） */
export function shouldBlockBookForInsufficientBenefit(
  remain: number | null | undefined,
  needCount = 1,
): boolean {
  if (remain == null || Number.isNaN(Number(remain))) return false;
  if (remain === -1) return false;
  return remain < needCount;
}

/** 9月25日（周五）19:00–20:00 */
export function formatBookingDateTimeText(
  sessionDate?: string,
  startTime?: string,
  endTime?: string,
) {
  const start = formatHm(startTime) || '--';
  const end = formatHm(endTime) || '--';
  const range = `${start}–${end}`;
  const date = sessionDate?.trim() || '';
  if (!date) return range;
  const m = moment(date, 'YYYY-MM-DD');
  if (!m.isValid()) return range;
  const weekday = WEEKDAY_LABELS[m.day()] || '';
  return `${m.format('M月D日')}（${weekday}）${range}`;
}

function buildSessionSummaryLines(info: BookingDialogInfo) {
  const courseName = info.courseName?.trim() || '课程';
  const coachName = info.coachName?.trim() || '教练';
  const timeText = formatBookingDateTimeText(
    info.sessionDate,
    info.startTime,
    info.endTime,
  );
  const stationName = info.stationName?.trim() || '门店';
  return [
    `课程：${courseName}`,
    `教练：${coachName}`,
    `时间：${timeText}`,
    `地点：${stationName}`,
  ];
}

export function buildBookConfirmContent(
  info: BookingDialogInfo,
  courseType: CourseSessionType | string,
) {
  const typeLabel = courseTypeBenefitLabel(courseType);
  return [
    ...buildSessionSummaryLines(info),
    `确认预约后，该时段将为你保留，并使用 1次${typeLabel}次数，请确认是否预约？`,
  ].join('\n');
}

export function buildCancelConfirmContent(
  info: BookingDialogInfo,
  courseType: CourseSessionType | string,
) {
  const typeLabel = courseTypeBenefitLabel(courseType);
  return [
    ...buildSessionSummaryLines(info),
    `确定要取消本次课程预约吗？取消预约后将会自动退还 1次${typeLabel}次数`,
  ].join('\n');
}

export function buildInsufficientBenefitContent(
  courseType: CourseSessionType | string,
  remainCount = 0,
  needCount = 1,
) {
  const typeLabel = courseTypeBenefitLabel(courseType);
  return [
    `当前可用的${typeLabel}次数不足，无法预约本次课程。`,
    `剩余次数：${remainCount}次`,
    `本次课程需要：${needCount}次`,
    '请先获取对应课程权益后再进行预约。',
  ].join('\n');
}

function AlertBody({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 14, lineHeight: 22, color: '#333333', textAlign: 'left' }}>
      {text}
    </Text>
  );
}

/** 是否权益/次数不足类错误 */
export function isInsufficientBenefitMsg(msg?: string) {
  const text = msg?.trim() || '';
  if (!text) return false;
  return /次数不足|权益不足|课次不足|可用.*不足|不足.*次数/.test(text);
}

/** 从错误文案尽量解析剩余次数 */
export function parseRemainCountFromMsg(msg?: string, fallback = 0) {
  const text = msg?.trim() || '';
  const matched = text.match(/剩余[^0-9]*(\d+)/);
  if (!matched) return fallback;
  const n = Number(matched[1]);
  return Number.isFinite(n) ? n : fallback;
}

export function showBookConfirmAlert(options: {
  info: BookingDialogInfo;
  courseType: CourseSessionType | string;
  onConfirm: () => void;
}) {
  Modal.alert(
    '确认预约',
    <AlertBody text={buildBookConfirmContent(options.info, options.courseType)} />,
    [
      { text: '取消', style: 'cancel' },
      { text: '确认预约', onPress: options.onConfirm },
    ],
  );
}

export function showCancelConfirmAlert(options: {
  info: BookingDialogInfo;
  courseType: CourseSessionType | string;
  onConfirm: () => void;
}) {
  Modal.alert(
    '取消课程？',
    <AlertBody text={buildCancelConfirmContent(options.info, options.courseType)} />,
    [
      { text: '暂不取消', style: 'cancel' },
      { text: '确认取消', onPress: options.onConfirm },
    ],
  );
}

export function showInsufficientBenefitAlert(options: {
  courseType: CourseSessionType | string;
  remainCount?: number;
  needCount?: number;
  /** 点击「查看权益」；默认 Toast 提示 */
  onViewBenefit?: () => void;
}) {
  Modal.alert(
    '课程次数不足',
    <AlertBody
      text={buildInsufficientBenefitContent(
        options.courseType,
        options.remainCount ?? 0,
        options.needCount ?? 1,
      )}
    />,
    [
      { text: '取消', style: 'cancel' },
      {
        text: '查看权益',
        onPress: () => {
          if (options.onViewBenefit) {
            options.onViewBenefit();
            return;
          }
          Toast.show('请联系顾问获取课程权益', 1.5);
        },
      },
    ],
  );
}

/** 次数不足时弹窗并返回 true；足够或未知则返回 false */
export function tryShowInsufficientBenefitAlert(options: {
  courseType: CourseSessionType | string;
  remainCount?: number | null;
  needCount?: number;
  onViewBenefit: () => void;
}): boolean {
  const needCount = options.needCount ?? 1;
  if (!shouldBlockBookForInsufficientBenefit(options.remainCount, needCount)) {
    return false;
  }
  showInsufficientBenefitAlert({
    courseType: options.courseType,
    remainCount: Math.max(0, Math.floor(Number(options.remainCount))),
    needCount,
    onViewBenefit: options.onViewBenefit,
  });
  return true;
}

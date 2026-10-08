/** 场次状态：0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */

/** 进行中 / 已结束 / 已取消：不可取消预约、不可调整时间 */
export function canCancelOrAdjustSession(status?: number | null) {
  const s = Number(status);
  return s !== 4 && s !== 5 && s !== 6;
}

/** 预约已结束态：已取消 / 已核销(含签到) / 已爽约 → 详情不再展示取消预约、进入直播 */
export function isBookingActionClosed(bookingStatus?: number | null) {
  const s = Number(bookingStatus);
  return s === 2 || s === 3 || s === 4;
}

/** 预约缺席（已爽约）→ 详情展示「重新预约」 */
export function isBookingAbsentStatus(bookingStatus?: number | null) {
  return Number(bookingStatus) === 4;
}

export type SessionActionTone =
  | 'book'
  | 'booked'
  | 'deadline'
  | 'ongoing'
  | 'ended'
  | 'full';

export type SessionActionView = {
  tone: SessionActionTone;
  label: string;
  /** 是否可点击预约/取消 */
  pressable: boolean;
};

/** 列表卡片右侧操作态（私教 / 集体 / 线上） */
export function resolveSessionAction(params: {
  status?: number;
  bookedByMe?: boolean;
  /** 可预约时文案，默认「预约教练」 */
  bookLabel?: string;
  /** 已预约可取消时文案，默认「已预约」 */
  bookedLabel?: string;
}): SessionActionView {
  const status = Number(params.status);
  const bookedByMe = Boolean(params.bookedByMe);
  const bookLabel = params.bookLabel?.trim() || '预约教练';
  const bookedLabel = params.bookedLabel?.trim() || '已预约';

  // 已结束 → 已过期（不可再约）
  if (status === 5) {
    return { tone: 'ended', label: '已过期', pressable: false };
  }
  if (status === 6) {
    return { tone: 'ended', label: '已取消', pressable: false };
  }
  if (status === 4) {
    return { tone: 'ongoing', label: '进行中', pressable: false };
  }
  if (bookedByMe) {
    return { tone: 'booked', label: bookedLabel, pressable: true };
  }
  if (status === 3) {
    return { tone: 'deadline', label: '报名截止', pressable: false };
  }
  if (status === 2) {
    return { tone: 'full', label: '已满员', pressable: false };
  }
  return { tone: 'book', label: bookLabel, pressable: true };
}

/** 场次状态：0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */

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

/** 列表卡片右侧操作态（私教等） */
export function resolveSessionAction(params: {
  status?: number;
  bookedByMe?: boolean;
}): SessionActionView {
  const status = params.status;
  const bookedByMe = Boolean(params.bookedByMe);

  if (status === 5 || status === 6) {
    return { tone: 'ended', label: '已结束', pressable: false };
  }
  if (status === 4) {
    return { tone: 'ongoing', label: '进行中', pressable: false };
  }
  if (bookedByMe) {
    return { tone: 'booked', label: '已预约', pressable: true };
  }
  if (status === 3) {
    return { tone: 'deadline', label: '报名截止', pressable: false };
  }
  if (status === 2) {
    return { tone: 'full', label: '已满员', pressable: false };
  }
  return { tone: 'book', label: '预约教练', pressable: true };
}

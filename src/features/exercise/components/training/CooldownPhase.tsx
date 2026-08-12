import React, { useMemo } from 'react';
import type { InUseExPatientRule } from '@/api/schedule';
import {
  formatCooldownBannerTitle,
  getCooldownColdList,
  type TrainingActionDateMode,
} from '../../utils/trainingPhaseHelpers';
import TrainingPhaseListPanel, { type TrainingPhaseListConfig } from './TrainingPhaseListPanel';

type Props = {
  dayRule?: InUseExPatientRule | null;
  selectedDate: string;
  readOnly?: boolean;
  dateMode?: TrainingActionDateMode;
};

export default function CooldownPhase({
  dayRule = null,
  selectedDate,
  readOnly = false,
  dateMode = 'today',
}: Props) {
  const config = useMemo<TrainingPhaseListConfig>(() => ({
    trainingPhase: 'cold',
    bannerSource: require('@/assets/images/exercise/ls.png'),
    bannerDesc: '低强度活动 + 静态拉伸，帮助心率平稳回落、促进恢复。',
    restEmptyText: '今日为休息日，暂无冷身安排',
    emptyText: '暂无冷身训练项目',
    formatBannerTitle: formatCooldownBannerTitle,
    getList: (rule, date) => {
      const { isRest, coldList } = getCooldownColdList(rule, date);
      return { isRest, items: coldList };
    },
  }), []);

  return (
    <TrainingPhaseListPanel
      dayRule={dayRule}
      selectedDate={selectedDate}
      config={config}
      readOnly={readOnly}
      dateMode={dateMode}
    />
  );
}

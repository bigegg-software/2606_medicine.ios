import React, { useMemo } from 'react';
import type { InUseExPatientRule } from '@/api/schedule';
import {
  formatWarmupBannerTitle,
  getWarmupHotList,
  type TrainingActionDateMode,
} from '../../utils/trainingPhaseHelpers';
import TrainingPhaseListPanel, { type TrainingPhaseListConfig } from './TrainingPhaseListPanel';

type Props = {
  dayRule?: InUseExPatientRule | null;
  selectedDate: string;
  readOnly?: boolean;
  disablePlayer?: boolean;
  dateMode?: TrainingActionDateMode;
  patientUserId?: string;
};

export default function WarmupPhase({
  dayRule = null,
  selectedDate,
  readOnly = false,
  disablePlayer = false,
  dateMode = 'today',
  patientUserId,
}: Props) {
  const config = useMemo<TrainingPhaseListConfig>(() => ({
    trainingPhase: 'hot',
    bannerSource: require('@/assets/images/exercise/rs.png'),
    bannerDesc: '低强度有氧 + 动态拉伸，唤醒身体、升高体温、降低受伤风险。',
    restEmptyText: '今日为休息日，暂无热身安排',
    emptyText: '暂无热身训练项目',
    formatBannerTitle: formatWarmupBannerTitle,
    getList: (rule, date) => {
      const { isRest, hotList } = getWarmupHotList(rule, date);
      return { isRest, items: hotList };
    },
  }), []);

  return (
    <TrainingPhaseListPanel
      dayRule={dayRule}
      selectedDate={selectedDate}
      config={config}
      readOnly={readOnly}
      disablePlayer={disablePlayer}
      dateMode={dateMode}
      patientUserId={patientUserId}
    />
  );
}

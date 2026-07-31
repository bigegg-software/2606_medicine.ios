export type FeedbackFaqItem = {
  id: string;
  title: string;
  answer?: string;
  /** points-rules：展开后请求积分规则并渲染表格 */
  kind?: 'text' | 'points-rules';
};

export const FEEDBACK_FAQ_LIST: FeedbackFaqItem[] = [
  {
    id: 'vitals-record',
    title: '体征数据怎么记录？',
    answer:
      '手动记录：点击对应卡片（如“血压”）> 点击“记录数据” > 输入数值保存。\n自动同步：穿戴设备连接后，同步的数据将自动上传至“近7天/30天”趋势图中。',
  },
  {
    id: 'exercise-prescription',
    title: '“运动处方”里的任务怎么完成？',
    answer:
      '点击今日要锻炼的项目（如：有氧心肺），跟随视频指导进行。系统将自动记录您的完成时长。',
  },
  {
    id: 'medication-reminder',
    title: '忘记吃药了，APP会提醒我吗？',
    answer:
      '会的。只要您在“用药记录”中添加了药品并设置了时间，APP会在指定时间通过通知栏消息提醒您。',
  },
  {
    id: 'switch-family-view',
    title: '怎么切换“家属视角”？',
    answer:
      '我的 > 视角 > 点击“家属视角”。输入您想查看的用户信息绑定，即可查看用户数据。',
  },
  {
    id: 'family-view-data',
    title: '家属视角下，能看到用户的所有数据吗？',
    answer:
      '是的，切换家属视角后，您可以看到用户授权的健康、运动、营养、用药等全部数据，但无法修改用户的个人信息，确保数据安全。',
  },
  {
    id: 'how-to-get-points',
    title: '如何获得积分？',
    kind: 'points-rules',
    answer:
      '积分获取方式以系统当前生效的积分规则为准（由管理端配置）。规则启用或关闭后，APP中展示的积分规则也会同步更新，请以页面实际规则说明为准。',
  },
];

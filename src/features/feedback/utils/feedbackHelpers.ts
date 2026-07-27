export type FeedbackFaqItem = {
    id: string;
    title: string;
    answer: string;
};

export const FEEDBACK_FAQ_LIST: FeedbackFaqItem[] = [
    {
        id: 'bind-device',
        title: '如何绑定智能设备?',
        answer: '进入「我的」-「我的设备」，点击「添加新设备」，打开手机蓝牙，按照提示操作即可完成设备绑定。',
    },
    {
        id: 'medication-reminder',
        title: '如何设置用药提醒？',
        answer: '进入用药管理页面，添加药品后可为对应药品设置提醒时间、频次和提醒方式，保存后系统会按计划提醒您按时用药。',
    },
    {
        id: 'family-health-data',
        title: '家人如何查看我的健康数据？',
        answer: '进入家庭成员或家人管理相关页面，邀请家人加入并完成授权后，家人即可查看您开放范围内的健康数据。',
    },
    {
        id: 'online-consultation',
        title: '如何预约线上问诊？',
        answer: '进入线上问诊或相关医疗服务入口，选择医生与可预约时间，确认信息并提交后即可完成预约。',
    },
    {
        id: 'points-usage',
        title: '积分如何获取和使用？',
        answer: '完成签到、健康记录、设备使用或平台活动后可获得积分；积分可在支持的服务或权益页面按规则进行兑换和使用。',
    },
    {
        id: 'font-size',
        title: '如何调整字体大小？',
        answer: '可在应用设置或跟随系统显示设置中调整字体大小；若当前页面支持，也会根据系统字体设置同步显示效果。',
    },
];

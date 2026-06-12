export const MEDICAL_RECORD_TYPE_LIST = [
    { label: '门诊', value: '门诊' },
    { label: '急诊', value: '急诊' },
    { label: '住院', value: '住院' },
    { label: '体检', value: '体检' },
    { label: '复诊', value: '复诊' },
    { label: '其他', value: '其他' },
] as const;

export type MedicalRecordNavItem = {
    label: string;
    value: string;
    type: string;
};

export function buildMedicalRecordNavList(): MedicalRecordNavItem[] {
    return [
        { label: '全部', value: 'all', type: '' },
        ...MEDICAL_RECORD_TYPE_LIST.map(item => ({
            label: item.label,
            value: item.value,
            type: item.value,
        })),
    ];
}

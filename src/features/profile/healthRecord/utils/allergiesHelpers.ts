import styles from '@/css/profile/allergies';

export const ALLERGEN_NAME_MAX_LENGTH = 50;
export const SEVERITY_OPTIONS = ['轻度', '中度', '严重'] as const;

export function limitText(value: string, maxLength: number) {
    return value.slice(0, maxLength);
}

export function getAllergenPlaceholder(allergyType: string) {
    switch (allergyType) {
        case '药物过敏':
            return '如：青霉素、头孢类、阿司匹林';
        case '食物过敏':
            return '如：海鲜、花生、牛奶、鸡蛋';
        case '其他':
            return '如：花粉、尘螨、动物毛发、乳胶';
        default:
            return '请输入过敏原名称';
    }
}

export function normalizeSeverity(value?: string) {
    if ((SEVERITY_OPTIONS as readonly string[]).includes(value ?? '')) {
        return value!;
    }
    return SEVERITY_OPTIONS[0];
}

export function getSeverityStyles(severity?: string) {
    switch (severity) {
        case '轻度':
            return { box: styles.severityMildBox, text: styles.severityMildText };
        case '中度':
            return { box: styles.severityModerateBox, text: styles.severityModerateText };
        case '严重':
            return { box: styles.severitySevereBox, text: styles.severitySevereText };
        default:
            return { box: styles.severityModerateBox, text: styles.severityModerateText };
    }
}

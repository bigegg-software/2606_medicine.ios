import type { FamilyMedicalItem } from '@/api/familyMedical';
import styles from '@/css/profile/familyHistory';

export const RELATION_OPTIONS = ['父亲', '母亲', '祖父', '祖母', '外祖父', '外祖母', '兄弟', '姐妹', '其他'] as const;
export const DISEASE_OPTIONS = ['高血压', '糖尿病', '冠心病', '癌症', '心脏病', '肺病', '肝病', '肾病', '精神疾病'] as const;
export const STATUS_OPTIONS = ['在世', '已故'] as const;

export function formatMemberTitle(item: FamilyMedicalItem) {
    const relation = item.familyRelationships || '—';
    const age = item.age != null ? String(item.age) : '—';
    if (item.status === '已故') {
        return `${relation}·享年${age}岁`;
    }
    return `${relation}·${age}岁`;
}

export function parseMedicalCondition(condition?: string) {
    if (!condition) {
        return { diseases: [] as string[], otherDisease: '' };
    }
    const known: string[] = [];
    const other: string[] = [];
    for (const part of condition.split(',').map(s => s.trim()).filter(Boolean)) {
        if ((DISEASE_OPTIONS as readonly string[]).includes(part)) {
            known.push(part);
        } else {
            other.push(part);
        }
    }
    return { diseases: known, otherDisease: other.join(',') };
}

export function getStatusStyles(status?: string) {
    if (status === '在世') {
        return { box: styles.statusAliveBox, text: styles.statusAliveText };
    }
    return { box: styles.statusDeceasedBox, text: styles.statusDeceasedText };
}

import type { MedicalRecord } from '@/api/medicalRecord';

let pendingIdentifyRecord: MedicalRecord | null = null;

export function pushPendingIdentifyRecord(record: MedicalRecord) {
    pendingIdentifyRecord = record;
}

export function consumePendingIdentifyRecord() {
    const record = pendingIdentifyRecord;
    pendingIdentifyRecord = null;
    return record;
}

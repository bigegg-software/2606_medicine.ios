import React from 'react';
import { getMedications } from '@/api/health';
import { HealthListScreen } from '@/src/features/health/healthListPage';

export default function MedicationPage() {
  return (
    <HealthListScreen
      title="用药记录"
      loadItems={getMedications}
      mapTitle={item => String(item.name ?? item.drugName ?? '药物')}
      mapSubtitle={item => String(item.dosage ?? item.schedule ?? '')}
    />
  );
}

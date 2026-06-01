import React from 'react';
import { getFamilyHistory, deleteFamilyHistory } from '@/api/health';
import { HealthListScreen } from '@/src/features/health/healthListPage';

export default function FamilyHistoryPage() {
  return (
    <HealthListScreen
      title="家族史"
      loadItems={getFamilyHistory}
      deleteItem={deleteFamilyHistory}
      mapTitle={item => String(item.disease ?? item.condition ?? '疾病')}
      mapSubtitle={item => String(item.relation ?? item.familyMember ?? '')}
    />
  );
}

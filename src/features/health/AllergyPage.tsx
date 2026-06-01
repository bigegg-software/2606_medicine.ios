import React from 'react';
import { getAllergies, deleteAllergy } from '@/api/health';
import { HealthListScreen } from '@/src/features/health/healthListPage';

export default function AllergyPage() {
  return (
    <HealthListScreen
      title="过敏史"
      loadItems={getAllergies}
      deleteItem={deleteAllergy}
      mapTitle={item => String(item.allergen ?? item.name ?? '过敏原')}
      mapSubtitle={item => String(item.reaction ?? item.severity ?? '')}
    />
  );
}

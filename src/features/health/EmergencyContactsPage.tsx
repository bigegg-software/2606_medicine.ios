import React from 'react';
import { getEmergencyContacts, deleteEmergencyContact } from '@/api/health';
import { HealthListScreen } from '@/src/features/health/healthListPage';

export default function EmergencyContactsPage() {
  return (
    <HealthListScreen
      title="紧急联系人"
      loadItems={getEmergencyContacts}
      deleteItem={deleteEmergencyContact}
      mapTitle={item => String(item.name ?? '联系人')}
      mapSubtitle={item => String(item.phone ?? item.mobile ?? '')}
    />
  );
}

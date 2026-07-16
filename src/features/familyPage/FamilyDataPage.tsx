import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, ImageBackground } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import styles from '@/css/family/home';

export default function SchedulePage() {


  return (
    <TabPageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text>1231</Text>
      </ScrollView>
    </TabPageLayout>
  );
}

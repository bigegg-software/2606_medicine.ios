import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabPageLayout } from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/curriculum/index';
import type { RootStackParamList } from '@/route/router';
import PrivateTrainingPage from './components/PrivateTrainingPage';
import GroupTrainingPage from './components/GroupTrainingPage';
import OnlineTrainingPage from './components/OnlineTrainingPage';
import ServiceStationHeader from './components/ServiceStationHeader';
import type { SelectedServiceStation } from './utils/serviceStationHelpers';

const PAGE_LIST = [
  { key: 'private', title: '私教训练' },
  { key: 'group', title: '集体训练' },
  { key: 'online', title: '线上训练' },
] as const;

type CurriculumNavKey = (typeof PAGE_LIST)[number]['key'];

export default function CurriculumPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeNav, setActiveNav] = useState<CurriculumNavKey>('private');
  const [stationId, setStationId] = useState('');
  const [mountedTabs, setMountedTabs] = useState<Partial<Record<CurriculumNavKey, boolean>>>({
    private: true,
  });

  const onPressNav = useCallback((key: CurriculumNavKey) => {
    setActiveNav(key);
    setMountedTabs(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const onStationChange = useCallback((station: SelectedServiceStation | null) => {
    setStationId(station?.stationId?.trim() || '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        title: '',
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerTitle: () => null,
        headerRight: () => null,
      });
    }, [navigation]),
  );

  return (
    <TabPageLayout style={styles.container}>
      <ServiceStationHeader onStationChange={onStationChange} />

      <Flex style={styles.navBox}>
        {PAGE_LIST.map(page => (
          <Flex
            key={page.key}
            style={[styles.navItem, activeNav === page.key && styles.activeNavItem]}
            justify="center"
            onPress={() => onPressNav(page.key)}
          >
            <Text
              style={[styles.navText, activeNav === page.key && styles.activeNavText]}
              numberOfLines={1}
            >
              {page.title}
            </Text>
          </Flex>
        ))}
      </Flex>

      <View style={styles.pageContent}>
        {mountedTabs.private ? (
          <View style={{ flex: 1, display: activeNav === 'private' ? 'flex' : 'none' }}>
            <PrivateTrainingPage stationId={stationId} />
          </View>
        ) : null}
        {mountedTabs.group ? (
          <View style={{ flex: 1, display: activeNav === 'group' ? 'flex' : 'none' }}>
            <GroupTrainingPage stationId={stationId} />
          </View>
        ) : null}
        {mountedTabs.online ? (
          <View style={{ flex: 1, display: activeNav === 'online' ? 'flex' : 'none' }}>
            <OnlineTrainingPage stationId={stationId} />
          </View>
        ) : null}
      </View>
    </TabPageLayout>
  );
}

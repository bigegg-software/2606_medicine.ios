import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { DotLottie } from '@lottiefiles/dotlottie-react-native';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/equipment/search';

const SEARCH_TIMEOUT_MS = 30_000;
/** 演示：模拟搜到设备的延时，后续接真实扫描 */
const MOCK_FIND_MS = 2_000;

type ScannedDevice = {
  id: string;
  name: string;
  deviceId: string;
};

const MOCK_FOUND_DEVICES: ScannedDevice[] = [
  { id: '1', name: 'Polar H10 0C9899900', deviceId: 'OC452336' },
];

const SEARCH_TIPS: Array<{
  prefix: string;
  highlights?: Array<{ text: string; suffix: string }>;
  suffix?: string;
}> = [
  { prefix: '1. 确保Polar设备已开启并处于配对模式' },
  {
    prefix: '2. 点击',
    highlights: [{ text: '“扫描设备”', suffix: '查找附近的Polar设备' }],
  },
  {
    prefix: '3. 从列表中选择设备并点击',
    highlights: [{ text: '“连接”', suffix: '' }],
  },
  { prefix: '4. 连接成功后可以开始心率监测' },
];

/**
 * 搜索 / 添加 Polar 等蓝牙设备
 */
export default function EquipmentSearchPage() {
  const [searchKey, setSearchKey] = useState(0);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const [foundDevices, setFoundDevices] = useState<ScannedDevice[]>([]);

  useEffect(() => {
    setSearchTimedOut(false);
    setFoundDevices([]);

    const findTimer = setTimeout(() => {
      setFoundDevices(MOCK_FOUND_DEVICES);
    }, MOCK_FIND_MS);

    const emptyTimer = setTimeout(() => {
      setFoundDevices(prev => {
        if (prev.length === 0) {
          setSearchTimedOut(true);
        }
        return prev;
      });
    }, SEARCH_TIMEOUT_MS);

    return () => {
      clearTimeout(findTimer);
      clearTimeout(emptyTimer);
    };
  }, [searchKey]);

  const handleResearch = useCallback(() => {
    setSearchKey(key => key + 1);
  }, []);

  const hasFound = foundDevices.length > 0;

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          hasFound ? styles.contentFound : styles.contentIdle,
        ]}
        scrollEnabled={hasFound}
        bounces={hasFound}>
        {hasFound ? (
          <View style={styles.foundModule}>
            <Flex align="center" justify="between" style={styles.foundHeader}>
              <Text style={styles.foundTitle}>搜索结果</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.researchBtn}
                onPress={handleResearch}>
                <Flex align="center">
                  <Image
                    source={require('@/assets/images/equipment/icon_research.png')}
                    style={styles.researchBtnIcon}
                  />
                  <Text style={styles.researchBtnText}>重新搜索</Text>
                </Flex>
              </TouchableOpacity>
            </Flex>

            <View style={styles.foundList}>
              {foundDevices.map(item => (
                <View key={item.id} style={styles.foundCard}>
                  <Image
                    source={require('@/assets/images/equipment/logo.png')}
                    style={styles.foundLogo}
                  />
                  <View style={styles.foundInfo}>
                    <Text style={styles.foundName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.foundId} numberOfLines={1}>
                      ID:{item.deviceId}
                    </Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.75} style={styles.connectBtn}>
                    <Flex align="center">
                      <Image
                        source={require('@/assets/images/equipment/icon_link.png')}
                        style={styles.connectBtnIcon}
                      />
                      <Text style={styles.connectBtnText}>连接</Text>
                    </Flex>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.contentModule}>
            <View style={styles.searchHero}>
              {searchTimedOut ? (
                <Image
                  source={require('@/assets/images/equipment/icon_search.png')}
                  style={styles.searchIcon}
                />
              ) : (
                <DotLottie
                  source={require('@/assets/images/equipment/search.lottie')}
                  style={styles.searchLottie}
                  autoplay
                  loop
                />
              )}
              <Text style={styles.searchingText}>
                {searchTimedOut ? '未搜索到设备' : '正在搜索设备'}
              </Text>
            </View>

            <View style={styles.tipBox}>
              {SEARCH_TIPS.map((item, index) => (
                <Text key={`tip-${index}`} style={styles.tipText}>
                  {item.prefix}
                  {item.highlights?.map((part, partIndex) => (
                    <Text key={`tip-${index}-${partIndex}`}>
                      <Text style={styles.tipHighlight}>{part.text}</Text>
                      {part.suffix}
                    </Text>
                  ))}
                  {item.suffix ?? ''}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </PageLayout>
  );
}

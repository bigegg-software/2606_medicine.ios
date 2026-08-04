import React from 'react';
import { View, Text, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '@/css/exercise';
import TrainingPlayerRing from './TrainingPlayerRing';

export default function MainTrainingPhase() {
  return (
    <View style={styles.trainingPhaseContent}>
      <View style={styles.mainTrainingModule}>
        <Flex align="center" justify="between">
          <Flex align="center" style={{ flexShrink: 1 }}>
            <Image
              style={styles.mainTrainingModuleIcon}
              tintColor={"#333"}
              source={require('@/assets/images/exercise/exercise3.png')}
            />
            <View style={styles.mainTrainingModuleTitleWrap}>
              <LinearGradient
                colors={['#6D925E', 'rgba(109,146,94,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainTrainingModuleUnderline}
              />
              <Text style={styles.mainTrainingModuleTitle}>有氧·心肺耐力</Text>
            </View>
          </Flex>
          <Flex align="center" style={styles.mainTrainingModuleTagRow}>
            <View style={styles.mainTrainingModuleTag}>
              <Text style={styles.mainTrainingModuleTagText}>快走/慢跑</Text>
            </View>
            <View style={styles.mainTrainingModuleTag}>
              <Text style={styles.mainTrainingModuleTagText}>RPE 5-6/10</Text>
            </View>
          </Flex>
        </Flex>

        <Flex align="center" style={styles.mainTrainingHrRow}>
          <Image
            style={styles.mainTrainingHrIcon}
            source={require('@/assets/images/exercise/xl.png')}
          />
          <View style={styles.mainTrainingHrInfo}>
            <Flex align="center" justify="between">
              <Text style={styles.mainTrainingHrLabel}>目标区间 125–140</Text>
              <View style={styles.mainTrainingHrBadge}>
                <Text style={styles.mainTrainingHrBadgeText}>区间内</Text>
              </View>
            </Flex>
            <Text style={styles.mainTrainingHrValue}>
              150
              <Text style={styles.mainTrainingHrUnit}> bpm</Text>
            </Text>
          </View>
        </Flex>
        <View style={styles.mainTrainingDivider} />
        <Flex justify="center" align="center" style={styles.mainTrainingPlayerRow}>
          <Image style={styles.mainTrainingPlayerSideIcon}
            source={require('@/assets/images/exercise/icon_refresh.png')}
          />
          <View style={styles.mainTrainingPlayerCenter}>
            <TrainingPlayerRing progress={35} />
            <View style={styles.mainTrainingPlayerCenterText} pointerEvents="none">
              <Text style={styles.mainTrainingPlayerTime}>00:20:00</Text>
              <Text style={styles.mainTrainingPlayerGoal}>目标20分钟</Text>
            </View>
          </View>
          <Image style={styles.mainTrainingPlayerSideIcon}
            source={require('@/assets/images/exercise/icon_start.png')}
          />
        </Flex>

        <Flex align="center" style={styles.mainTrainingCheckIn}>
          <Image
            style={styles.mainTrainingCheckInIcon}
            source={require('@/assets/images/exercise/icon_dk.png')}
          />
          <Text style={styles.mainTrainingCheckInText}>戳我打卡</Text>
        </Flex>
      </View>
      <View style={styles.mainTrainingModule}>
        <Flex align="center" justify="between">
          <Flex align="center" style={{ flexShrink: 1 }}>
            <Image
              style={styles.mainTrainingModuleIcon}
              tintColor={"#333"}
              source={require('@/assets/images/exercise/exercise2.png')}
            />
            <View style={styles.mainTrainingModuleTitleWrap}>
              <LinearGradient
                colors={['#6D925E', 'rgba(109,146,94,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainTrainingModuleUnderline}
              />
              <Text style={styles.mainTrainingModuleTitle}>抗阻·力量</Text>
            </View>
          </Flex>
          <Flex align="center" style={styles.mainTrainingModuleTagRow}>
            <View style={styles.mainTrainingModuleTag}>
              <Text style={styles.mainTrainingModuleTagText}>60-70% 1RM</Text>
            </View>
            <View style={styles.mainTrainingModuleTag}>
              <Text style={styles.mainTrainingModuleTagText}>RPE 6-7</Text>
            </View>
          </Flex>
        </Flex>
        <View style={styles.mainTrainingActionRow}>
          <Flex align="center">
            <Image
              style={styles.mainTrainingActionThumb}
              source={require('@/assets/images/exercise/dtls.png')}
            />
            <View style={styles.mainTrainingActionInfo}>
              <Flex align="center" justify="between">
                <Text style={styles.mainTrainingActionTitle}>深蹲</Text>
                <Text style={styles.mainTrainingSetProgress}>
                  1
                  <Text style={styles.mainTrainingSetProgressTotal}>/3</Text>
                </Text>
              </Flex>
              <Text style={styles.mainTrainingActionDesc}>3 组 × 12 次 · 背阔肌</Text>
            </View>
          </Flex>
          <Flex align="center" style={styles.mainTrainingSetRow}>
            <Image
              style={styles.mainTrainingSetDoneIcon}
              source={require('@/assets/images/exercise/icon_wc.png')}
            />
            <View style={styles.mainTrainingSetTag}>
              <Text style={styles.mainTrainingSetTagText}>第2组</Text>
            </View>
            <View style={styles.mainTrainingSetTag}>
              <Text style={styles.mainTrainingSetTagText}>第3组</Text>
            </View>
            <Flex align="center" style={styles.mainTrainingSetTag}>
              <Image
                style={styles.mainTrainingSetDurationIcon}
                source={require('@/assets/images/exercise/icon_time.png')}
              />
              <Text style={styles.mainTrainingSetTagText}>60s</Text>
            </Flex>
          </Flex>
        </View>
        <View style={styles.mainTrainingActionDivider} />
        <View style={styles.mainTrainingActionRow}>
          <Flex align="center">
            <Image
              style={styles.mainTrainingActionThumb}
              source={require('@/assets/images/exercise/dtls.png')}
            />
            <View style={styles.mainTrainingActionInfo}>
              <Flex align="center" justify="between">
                <Text style={styles.mainTrainingActionTitle}>深蹲</Text>
                <Text style={styles.mainTrainingSetProgress}>
                  1
                  <Text style={styles.mainTrainingSetProgressTotal}>/3</Text>
                </Text>
              </Flex>
              <Text style={styles.mainTrainingActionDesc}>3 组 × 12 次 · 背阔肌</Text>
            </View>
          </Flex>
          <Flex align="center" style={styles.mainTrainingSetRow}>
            <View style={styles.mainTrainingSetTag}>
              <Text style={styles.mainTrainingSetTagText}>第1组</Text>
            </View>
            <View style={styles.mainTrainingSetTag}>
              <Text style={styles.mainTrainingSetTagText}>第2组</Text>
            </View>
            <View style={styles.mainTrainingSetTag}>
              <Text style={styles.mainTrainingSetTagText}>第3组</Text>
            </View>
            <Flex align="center" style={styles.mainTrainingSetTag}>
              <Image
                style={styles.mainTrainingSetDurationIcon}
                source={require('@/assets/images/exercise/icon_time.png')}
              />
              <Text style={styles.mainTrainingSetTagText}>60s</Text>
            </Flex>
          </Flex>
        </View>
      </View>
      <View style={styles.mainTrainingModule}>
        <Flex align="center" justify="between">
          <Flex align="center" style={{ flexShrink: 1 }}>
            <Image
              style={styles.mainTrainingModuleIcon}
              tintColor={"#333"}
              source={require('@/assets/images/exercise/exercise1.png')}
            />
            <View style={styles.mainTrainingModuleTitleWrap}>
              <LinearGradient
                colors={['#6D925E', 'rgba(109,146,94,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainTrainingModuleUnderline}
              />
              <Text style={styles.mainTrainingModuleTitle}>柔韧性</Text>
            </View>
            <Text style={styles.mainTrainingModuleTipText}>拉伸至轻微紧绷感</Text>
          </Flex>
        </Flex>
        <Flex align="center" style={styles.mainTrainingActionRow}>
          <Image
            style={styles.mainTrainingActionThumb}
            source={require('@/assets/images/exercise/dtls.png')}
          />
          <View style={styles.mainTrainingActionInfo}>
            <Text style={styles.mainTrainingActionTitle}>腘绳肌静态拉伸</Text>
            <Text style={styles.mainTrainingActionDesc}>保持 30s × 2 · 大腿后侧</Text>
          </View>
          <Flex align="center" style={styles.mainTrainingActionTimer}>
            <Image
              style={styles.mainTrainingActionTimerIcon}
              source={require('@/assets/images/exercise/icon_jsq.png')}
            />
            <Text style={styles.mainTrainingActionTimerText}>计时</Text>
          </Flex>
        </Flex>
        <Flex align="center" style={styles.mainTrainingActionRow}>
          <Image
            style={styles.mainTrainingActionThumb}
            source={require('@/assets/images/exercise/dtls.png')}
          />
          <View style={styles.mainTrainingActionInfo}>
            <Text style={styles.mainTrainingActionTitle}>胸部开肩拉伸</Text>
            <Text style={styles.mainTrainingActionDesc}>保持 25s × 2 · 胸 · 肩</Text>
          </View>
          <Flex align="center" style={styles.mainTrainingActionTimer}>
            <Image
              style={styles.mainTrainingActionTimerIcon}
              source={require('@/assets/images/exercise/icon_wc.png')}
            />
            <Text style={styles.mainTrainingActionTimerText}>完成</Text>
          </Flex>
        </Flex>
        <Flex align="center" style={styles.mainTrainingActionRow}>
          <Image
            style={styles.mainTrainingActionThumb}
            source={require('@/assets/images/exercise/dtls.png')}
          />
          <View style={styles.mainTrainingActionInfo}>
            <Text style={styles.mainTrainingActionTitle}>猫牛式脊柱活动</Text>
            <Text style={styles.mainTrainingActionDesc}>保持 20s × 3 · 脊柱</Text>
          </View>
          <Flex align="center" style={styles.mainTrainingActionTimer}>
            <Image
              style={styles.mainTrainingActionTimerIcon}
              source={require('@/assets/images/exercise/icon_jsq.png')}
            />
            <Text style={styles.mainTrainingActionTimerText}>计时</Text>
          </Flex>
        </Flex>
      </View>
      <View style={styles.mainTrainingModule}>
        <Flex align="center" justify="between">
          <Flex align="center" style={{ flexShrink: 1 }}>
            <Image
              style={styles.mainTrainingModuleIcon}
              tintColor={"#333"}
              source={require('@/assets/images/exercise/exercise4.png')}
            />
            <View style={styles.mainTrainingModuleTitleWrap}>
              <LinearGradient
                colors={['#6D925E', 'rgba(109,146,94,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainTrainingModuleUnderline}
              />
              <Text style={styles.mainTrainingModuleTitle}>平衡·神经运动</Text>
            </View>
            <Text style={styles.mainTrainingModuleTipText}>安全第一，可扶墙保护</Text>
          </Flex>
        </Flex>
        <Flex align="center" style={styles.mainTrainingActionRow}>
          <Image
            style={styles.mainTrainingActionThumb}
            source={require('@/assets/images/exercise/dtls.png')}
          />
          <View style={styles.mainTrainingActionInfo}>
            <Text style={styles.mainTrainingActionTitle}>单腿站立</Text>
            <Text style={styles.mainTrainingActionDesc}>30s · 扶墙保护，逐步松手</Text>
          </View>
          <Flex align="center" style={styles.mainTrainingActionTimer}>
            <Image
              style={styles.mainTrainingActionTimerIcon}
              source={require('@/assets/images/exercise/icon_wc.png')}
            />
            <Text style={styles.mainTrainingActionTimerText}>计时</Text>
          </Flex>
        </Flex>
      </View>

      <View style={styles.mainTrainingTipBox}>
        <Flex align="center">
          <Image
            style={styles.mainTrainingTipIcon}
            source={require('@/assets/images/exercise/icon_warn.png')}
          />
          <Text style={styles.mainTrainingTipTitle}>处方依据（ACSM FITT-VP）</Text>
        </Flex>
        <Text style={styles.mainTrainingTipText}>
          F 每周5天·I中等强度·T 20min·V ≥150min/周·P每2–4周进阶
          F 每周5天·I中等强度·T 20min·V ≥150min/周·P每2–4周进阶
        </Text>
      </View>
    </View>
  );
}


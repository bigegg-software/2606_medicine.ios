import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import styles from '@/css/profile/profile';

export type SignInModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SignInModal({ visible, onClose }: SignInModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.signInOverlay}>
        <View style={styles.signInWrap}>
          <Image style={styles.imgModel} source={require('@/assets/images/user/model_rl.png')} />
          <LinearGradient
            colors={['#E4F9D7', '#FFFFFF']}
            locations={[0, 0.5]}
            start={{ x: 0.8, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.signInBox}
          >
            <Image style={styles.imgModel1} source={require('@/assets/images/user/icon_title.png')} />
            <MaskedView style={styles.signInTitleMask}
              maskElement={<Text style={styles.signInTitle}>签到成功</Text>}
            >
              <LinearGradient
                colors={['#6D925E', '#2B2726']}
                locations={[0, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.signInTitleGradient}
              >
                <Text style={[styles.signInTitle, styles.signInTitleHidden]}>签到成功</Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.signInReward}>
              <Text style={styles.signInRewardNum}>+10</Text>
              <Text style={styles.signInRewardUnit}> 积分</Text>
            </Text>
            <Text style={styles.signInTip}>已连续签到5天，再连续签到2天可获得额外积分</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.signInConfirmBtnWrap}>
              <LinearGradient
                colors={['#9BBD8E', '#6D925E']}
                locations={[0, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.signInConfirmBtn}
              >
                <Text style={styles.signInConfirmText}>开心收下</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import styles from '@/css/profile/profile';

export type DietCheckInSuccessModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function DietCheckInSuccessModal({
  visible,
  onClose,
}: DietCheckInSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.signInOverlay}>
        <View style={localStyles.column}>
          <View style={styles.signInWrap}>
            <Image style={styles.imgModel} source={require('@/assets/images/user/model_rl.png')} />
            <LinearGradient
              colors={['#E4F9D7', '#FFFFFF']}
              locations={[0, 0.5]}
              start={{ x: 0.8, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[styles.signInBox, localStyles.boxNoConfirm]}
            >
              <Image
                style={styles.imgModel1}
                source={require('@/assets/images/user/icon_title.png')}
              />
              <MaskedView
                style={styles.signInTitleMask}
                maskElement={<Text style={styles.signInTitle}>打卡成功</Text>}
              >
                <LinearGradient
                  colors={['#6D925E', '#2B2726']}
                  locations={[0, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.signInTitleGradient}
                >
                  <Text style={[styles.signInTitle, styles.signInTitleHidden]}>打卡成功</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={[styles.signInTip, localStyles.tip]}>
                已完成今日饮食记录，坚持记录，健康每一天。
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={localStyles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Image
              source={require('@/assets/images/nutrition/icon_close.png')}
              style={localStyles.closeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  column: {
    alignItems: 'center',
  },
  boxNoConfirm: {
    paddingBottom: 28,
  },
  tip: {
    marginTop: 16,
    marginBottom: 4,
  },
  closeBtn: {
    marginTop: 40,
  },
  closeIcon: {
    width: 45,
    height: 45,
  },
});

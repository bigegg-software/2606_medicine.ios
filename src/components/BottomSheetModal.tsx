import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  dismissOnBackdropPress?: boolean;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
};

export default function BottomSheetModal({
  visible,
  onClose,
  onDismissed,
  dismissOnBackdropPress = true,
  children,
  sheetStyle,
}: BottomSheetModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [rendered, setRendered] = useState(visible);
  const onDismissedRef = useRef(onDismissed);

  useEffect(() => {
    onDismissedRef.current = onDismissed;
  }, [onDismissed]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!rendered) return;

    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        onDismissedRef.current?.();
      }
    });
  }, [rendered, slideAnim, visible]);

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        {dismissOnBackdropPress ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        ) : null}
        <Animated.View style={[styles.sheet, sheetStyle, { transform: [{ translateY: slideAnim }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
  },
});

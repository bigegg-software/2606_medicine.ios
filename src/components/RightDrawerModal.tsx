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

const SCREEN_WIDTH = Dimensions.get('window').width;

type RightDrawerModalProps = {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  dismissOnBackdropPress?: boolean;
  overlayOpacity?: number;
  drawerWidth?: number;
  children: ReactNode;
  drawerStyle?: StyleProp<ViewStyle>;
};

export default function RightDrawerModal({
  visible,
  onClose,
  onDismissed,
  dismissOnBackdropPress = true,
  overlayOpacity = 0.45,
  drawerWidth = SCREEN_WIDTH * 0.75,
  children,
  drawerStyle,
}: RightDrawerModalProps) {
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);
  const onDismissedRef = useRef(onDismissed);

  useEffect(() => {
    onDismissedRef.current = onDismissed;
  }, [onDismissed]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      slideAnim.setValue(drawerWidth);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!rendered) return;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: drawerWidth,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        onDismissedRef.current?.();
      }
    });
  }, [backdropAnim, drawerWidth, rendered, slideAnim, visible]);

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
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, overlayOpacity],
              }),
            },
          ]}
        />
        {dismissOnBackdropPress ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        ) : null}
        <Animated.View
          style={[
            styles.drawer,
            { width: drawerWidth, transform: [{ translateX: slideAnim }] },
            drawerStyle,
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  drawer: {
    maxWidth: '100%',
    height: '100%',
  },
});

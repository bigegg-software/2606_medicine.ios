import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type KeyboardEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const SCREEN = Dimensions.get('screen');
const SCREEN_HEIGHT = SCREEN.height;

function getKeyboardDuration(event: KeyboardEvent) {
  if (Platform.OS === 'ios' && typeof event.duration === 'number') {
    return event.duration;
  }
  return 250;
}

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  dismissOnBackdropPress?: boolean;
  overlayOpacity?: number;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  /** iOS InputAccessoryView / Android 键盘工具栏，须与 Modal 内 TextInput 同层挂载 */
  keyboardAccessory?: ReactNode;
};

export default function BottomSheetModal({
  visible,
  onClose,
  onDismissed,
  dismissOnBackdropPress = true,
  overlayOpacity = 0.5,
  children,
  sheetStyle,
  keyboardAccessory,
}: BottomSheetModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);
  const onDismissedRef = useRef(onDismissed);
  /** 关闭动画结束后再通知，避免调用方在 Modal 仍挂载时打开系统相册/相机 */
  const shouldNotifyDismissedRef = useRef(false);

  useEffect(() => {
    onDismissedRef.current = onDismissed;
  }, [onDismissed]);

  useEffect(() => {
    if (visible || rendered || !shouldNotifyDismissedRef.current) return;
    shouldNotifyDismissedRef.current = false;
    // 等 Modal 卸载完成后再回调，否则 iOS 系统相册常无法弹出
    const timer = setTimeout(() => {
      onDismissedRef.current?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [rendered, visible]);

  useEffect(() => {
    if (!rendered) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      // 用完整键盘高度上移，避免底部按钮被遮挡
      const height = Math.max(0, event.endCoordinates.height);
      Animated.timing(keyboardOffset, {
        toValue: -height,
        duration: getKeyboardDuration(event),
        useNativeDriver: true,
      }).start();
    };

    const onHide = (event: KeyboardEvent) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: getKeyboardDuration(event),
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset, rendered]);

  useEffect(() => {
    if (visible) return;
    keyboardOffset.setValue(0);
  }, [keyboardOffset, visible]);

  useEffect(() => {
    if (visible) {
      shouldNotifyDismissedRef.current = false;
      setRendered(true);
      slideAnim.setValue(SCREEN_HEIGHT);
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

    shouldNotifyDismissedRef.current = true;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
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
      } else {
        shouldNotifyDismissedRef.current = false;
      }
    });
  }, [backdropAnim, rendered, slideAnim, visible]);

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
          <Pressable style={styles.backdropDismiss} onPress={onClose} />
        ) : null}
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { transform: [{ translateY: Animated.add(slideAnim, keyboardOffset) }] },
          ]}>
          {children}
        </Animated.View>
        {keyboardAccessory ? (
          <View style={styles.keyboardAccessoryHost} pointerEvents="box-none">
            {keyboardAccessory}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: SCREEN.width,
    height: SCREEN.height,
    justifyContent: 'flex-end',
  },
  keyboardAccessoryHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN.width,
    height: SCREEN.height,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN.width,
    height: SCREEN.height,
    zIndex: 1,
  },
  sheet: {
    width: '100%',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 24,
  },
});

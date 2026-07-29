import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Keyboard,
  Platform,
  InputAccessoryView,
  StyleSheet,
  TouchableOpacity,
  Text,
  type KeyboardEvent,
} from 'react-native';

export const KEYBOARD_DONE_ACCESSORY_ID = 'keyboardDoneToolbar';

const styles = StyleSheet.create({
  keyboardAccessory: {
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(102,102,102,0.29)',
  },
  doneText: {
    color: '#027aff',
    fontSize: 17,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  overlayHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  overlayHostModal: {
    zIndex: 10000,
    elevation: 10000,
  },
  androidOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});

function DoneButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="完成">
      <Text style={styles.doneText}>完成</Text>
    </TouchableOpacity>
  );
}

export default function KeyboardDoneAccessory({
  nativeID = KEYBOARD_DONE_ACCESSORY_ID,
  useOverlay = false,
}: {
  nativeID?: string;
  /** Modal 内 iOS InputAccessoryView 无效，需改用键盘高度悬浮工具栏 */
  useOverlay?: boolean;
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const dismiss = useCallback(() => Keyboard.dismiss(), []);
  const overlayMode = useOverlay || Platform.OS === 'android';

  useEffect(() => {
    if (!overlayMode) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    // 父组件重渲染导致本组件重挂载时，键盘可能已弹出，需主动同步高度
    const metrics = Keyboard.metrics();
    if (metrics?.height) {
      setKeyboardHeight(metrics.height);
    }

    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [overlayMode]);

  if (!overlayMode && Platform.OS === 'ios') {
    return (
      <InputAccessoryView nativeID={nativeID}>
        <View style={styles.keyboardAccessory}>
          <DoneButton onPress={dismiss} />
        </View>
      </InputAccessoryView>
    );
  }

  if (keyboardHeight <= 0) return null;

  return (
    <View style={[styles.overlayHost, useOverlay && styles.overlayHostModal]} pointerEvents="box-none">
      <View style={[styles.androidOverlay, { bottom: keyboardHeight }]} pointerEvents="box-none">
        <View style={styles.keyboardAccessory}>
          <DoneButton onPress={dismiss} />
        </View>
      </View>
    </View>
  );
}

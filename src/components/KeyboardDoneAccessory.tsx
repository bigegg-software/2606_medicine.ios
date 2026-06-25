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
}: {
  nativeID?: string;
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const dismiss = useCallback(() => Keyboard.dismiss(), []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
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
    <View style={[styles.androidOverlay, { bottom: keyboardHeight }]} pointerEvents="box-none">
      <View style={styles.keyboardAccessory}>
        <DoneButton onPress={dismiss} />
      </View>
    </View>
  );
}

import React from 'react';
import { View, Keyboard, Platform, Button, InputAccessoryView, StyleSheet } from 'react-native';

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
    borderTopColor: '#d1d1d6',
  },
});

export default function KeyboardDoneAccessory({
  nativeID = KEYBOARD_DONE_ACCESSORY_ID,
}: {
  nativeID?: string;
}) {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.keyboardAccessory}>
        <Button title="完成" onPress={() => Keyboard.dismiss()} color="#027aff" />
      </View>
    </InputAccessoryView>
  );
}

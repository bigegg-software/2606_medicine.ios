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
    borderTopColor: 'rgba(102,102,102,0.29)',
  },
});

export default function KeyboardDoneAccessory({
  nativeID = KEYBOARD_DONE_ACCESSORY_ID,
}: {
  nativeID?: string;
}) {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID} backgroundColor="#f7f7f7">
      <View style={styles.keyboardAccessory}>
        <Button title="完成" onPress={() => Keyboard.dismiss()} color="#027aff" />
      </View>
    </InputAccessoryView>
  );
}

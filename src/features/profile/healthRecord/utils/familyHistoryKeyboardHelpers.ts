import {
    Dimensions,
    findNodeHandle,
    UIManager,
    type FocusEvent,
} from 'react-native';

export const KEYBOARD_ACCESSORY_HEIGHT = 44;
const EXTRA_GAP = 28;

/** 键盘弹出时内容底部留白，保证年龄等底部输入框有足够滚动空间 */
export function getKeyboardContentPadding(keyboardHeight: number) {
  if (keyboardHeight <= 0) return 40;
  return keyboardHeight + KEYBOARD_ACCESSORY_HEIGHT + 48;
}

/** 根据输入框窗口坐标与键盘高度，计算需要额外上滚的距离 */
export function getKeyboardScrollDelta(
  inputY: number,
  inputHeight: number,
  keyboardHeight: number,
): number {
  if (keyboardHeight <= 0) return 0;
  const windowHeight = Dimensions.get('window').height;
  const keyboardTop = windowHeight - keyboardHeight;
  const visibleLimit = keyboardTop - KEYBOARD_ACCESSORY_HEIGHT - EXTRA_GAP;
  const inputBottom = inputY + inputHeight;
  return Math.max(0, inputBottom - visibleLimit);
}

/** 从 focus 事件同步取出节点，避免 setTimeout 后 synthetic event 被回收 */
export function getFocusTargetHandle(e: FocusEvent): number | null {
  return findNodeHandle(e.target as never);
}

export function measureHandleInWindow(
  nodeHandle: number,
  onMeasure: (x: number, y: number, width: number, height: number) => void,
) {
  UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
    // 部分机型回调可能为 undefined
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof width !== 'number' ||
      typeof height !== 'number'
    ) {
      return;
    }
    onMeasure(x, y, width, height);
  });
}

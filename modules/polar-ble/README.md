# Polar BLE（H10）

本地 React Native 原生模块，桥接 PolarBleSdk，供 `src/test/polarDevice.tsx` 测试页使用。

## 接入步骤

```bash
npm install
cd ios && pod install && cd ..
npx expo run:ios
```

开发入口：我的 → 关于我们 → **Polar H10 测试**（仅 `__DEV__` 显示）。

也可直接导航：`navigation.navigate('PolarDeviceTestPage')`。

## 启动闪退排查

若安装后打不开，优先检查 `Info.plist` 是否包含：

- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`
- `NSBluetoothUsageDescription`

Polar 原生模块会创建 CoreBluetooth；缺少上述用途说明时，iOS 可能在启动阶段直接杀掉 App。
已改为懒加载初始化，但仍必须补齐蓝牙权限文案后重新编译安装。

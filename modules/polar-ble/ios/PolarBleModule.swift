import Foundation
import React
import PolarBleSdk
import RxSwift
import CoreBluetooth

/// Polar H10 桥接
/// - API 懒加载：避免启动时无蓝牙用途说明被杀
/// - 连接前必须停止 UI 扫描：SDK 的 connectToDevice 内部会再 search，并行扫描会导致一直连不上
@objc(PolarBle)
class PolarBleModule: RCTEventEmitter {
    
    private var api: PolarBleApi?
    private var hasListeners = false
    private var scanDisposable: Disposable?
    private var hrStreamingDisposables: [String: Disposable] = [:]
    private var ecgStreamingDisposables: [String: Disposable] = [:]
    
    override init() {
        super.init()
    }

    private func ensureApi() -> PolarBleApi? {
        if let api = api {
            return api
        }

        let features: Set<PolarBleSdkFeature> = [
            .feature_hr,
            .feature_battery_info,
            .feature_device_info,
            .feature_polar_online_streaming,
        ]

        var next = PolarBleApiDefaultImpl.polarImplementation(DispatchQueue.main, features: features)
        next.observer = self
        next.powerStateObserver = self
        next.deviceInfoObserver = self
        next.deviceFeaturesObserver = self
        api = next
        NSLog("[PolarBle] Polar API lazy-initialized")
        return next
    }

    private func stopScanInternal() {
        if scanDisposable != nil {
            NSLog("[PolarBle] Disposing active scan subscription")
        }
        scanDisposable?.dispose()
        scanDisposable = nil
    }

    private func emit(_ name: String, body: [String: Any]) {
        // 连接类事件即使 hasListeners 短暂为 false 也尽量发出，并打日志便于排查
        NSLog("[PolarBle] emit \(name): \(body)")
        if hasListeners {
            sendEvent(withName: name, body: body)
        } else {
            NSLog("[PolarBle] ⚠️ no JS listeners for \(name), event dropped")
        }
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return [
            "PolarDeviceConnecting",
            "PolarDeviceConnected",
            "PolarDeviceDisconnected",
            "PolarHrData",
            "PolarDeviceInfo",
            "PolarBatteryLevel",
            "PolarScanResult",
            "PolarEcgData",
        ]
    }
    
    override func startObserving() {
        hasListeners = true
        NSLog("[PolarBle] startObserving")
    }
    
    override func stopObserving() {
        hasListeners = false
        NSLog("[PolarBle] stopObserving")
    }
    
    // MARK: - Exported Methods
    
    @objc func initPolarSdk(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if ensureApi() != nil {
            resolve(true)
        } else {
            reject("init_failed", "Polar SDK initialization failed", nil)
        }
    }
    
    @objc func startScan(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let api = ensureApi() else {
            reject("not_initialized", "Polar SDK not initialized", nil)
            return
        }

        stopScanInternal()
        NSLog("[PolarBle] 🔍 Starting device scan...")
        
        scanDisposable = api.searchForDevice()
            .observe(on: MainScheduler.instance)
            .subscribe(
                onNext: { [weak self] deviceInfo in
                    guard let self = self else { return }
                    
                    NSLog("[PolarBle] 📱 Found device: \(deviceInfo.deviceId) - \(deviceInfo.name) (RSSI: \(deviceInfo.rssi), connectable: \(deviceInfo.connectable))")
                    
                    let deviceDict: [String: Any] = [
                        "deviceId": deviceInfo.deviceId,
                        "name": deviceInfo.name,
                        "rssi": deviceInfo.rssi,
                        "connectable": deviceInfo.connectable,
                    ]
                    self.emit("PolarScanResult", body: deviceDict)
                },
                onError: { error in
                    NSLog("[PolarBle] ❌ Scan error: \(error.localizedDescription)")
                },
                onCompleted: {
                    NSLog("[PolarBle] Scan completed")
                }
            )
        
        resolve(true)
    }

    @objc func stopScan(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        stopScanInternal()
        resolve(true)
    }
    
    @objc func connectToDevice(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let api = ensureApi() else {
            reject("not_initialized", "Polar SDK not initialized", nil)
            return
        }

        // 关键：必须先停掉 UI 扫描。connectToDevice 内部会再 search，两路并行会导致连接挂起
        stopScanInternal()
        
        NSLog("[PolarBle] Attempting to connect to device: \(deviceId)")

        // 清掉可能卡住的半连接
        do {
            try api.disconnectFromDevice(deviceId)
            NSLog("[PolarBle] Pre-connect disconnect issued for \(deviceId)")
        } catch {
            NSLog("[PolarBle] Pre-connect disconnect skipped: \(error.localizedDescription)")
        }
        
        do {
            try api.connectToDevice(deviceId)
            NSLog("[PolarBle] Connection initiated for device: \(deviceId)")
            resolve(true)
        } catch let error {
            NSLog("[PolarBle] Connection error for device \(deviceId): \(error.localizedDescription)")
            reject("connection_error", error.localizedDescription, error)
        }
    }
    
    @objc func disconnectFromDevice(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let api = ensureApi() else {
            reject("not_initialized", "Polar SDK not initialized", nil)
            return
        }
        
        do {
            try api.disconnectFromDevice(deviceId)
            NSLog("[PolarBle] Disconnecting from device: \(deviceId)")
            resolve(true)
        } catch {
            NSLog("[PolarBle] Disconnection error for device \(deviceId): \(error.localizedDescription)")
            reject("disconnection_error", error.localizedDescription, error)
        }
    }
    
    @objc func startHrStreaming(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let api = ensureApi() else {
            reject("not_initialized", "Polar SDK not initialized", nil)
            return
        }

        stopScanInternal()
        NSLog("[PolarBle] Starting HR streaming for device: \(deviceId)")

        hrStreamingDisposables[deviceId]?.dispose()
        
        let hrDisposable = api.startHrStreaming(deviceId)
            .observe(on: MainScheduler.instance)
            .subscribe(
                onNext: { [weak self] hrData in
                    guard let self = self else { return }
                    
                    if let firstHrData = hrData.first {
                        let heartRate = Int(firstHrData.hr)
                        let rrsArray = firstHrData.rrsMs
                        
                        NSLog("[PolarBle] HR value: \(deviceId) HR: \(heartRate)")
                        
                        self.emit("PolarHrData", body: [
                            "deviceId": deviceId,
                            "heartRate": heartRate,
                            "rrs": rrsArray,
                            "timestamp": Int(Date().timeIntervalSince1970 * 1000),
                        ])
                    }
                },
                onError: { [weak self] error in
                    NSLog("[PolarBle] ❌ HR streaming error for device \(deviceId): \(error.localizedDescription)")
                    self?.hrStreamingDisposables.removeValue(forKey: deviceId)
                },
                onCompleted: { [weak self] in
                    NSLog("[PolarBle] HR streaming completed for device: \(deviceId)")
                    self?.hrStreamingDisposables.removeValue(forKey: deviceId)
                }
            )
        
        hrStreamingDisposables[deviceId] = hrDisposable
        resolve(true)
    }
    
    @objc func stopHrStreaming(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        NSLog("[PolarBle] Stopping HR streaming for device: \(deviceId)")
        
        if let disposable = hrStreamingDisposables[deviceId] {
            disposable.dispose()
            hrStreamingDisposables.removeValue(forKey: deviceId)
        }
        
        resolve(true)
    }
    
    @objc func getDeviceInfo(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve([
            "deviceId": deviceId,
            "message": "Device info will be received via callbacks",
        ])
    }
    
    @objc func getBatteryLevel(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["message": "Battery level will be received via callbacks"])
    }
    
    @objc func startEcgStreaming(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let api = ensureApi() else {
            reject("not_initialized", "Polar SDK not initialized", nil)
            return
        }

        stopScanInternal()
        NSLog("[PolarBle] Starting ECG streaming for device: \(deviceId)")

        ecgStreamingDisposables[deviceId]?.dispose()
        
        let ecgDisposable = api.requestStreamSettings(deviceId, feature: .ecg)
            .observe(on: MainScheduler.instance)
            .asObservable()
            .flatMap { settings -> Observable<PolarEcgData> in
                NSLog("[PolarBle] ECG stream settings received")
                return api.startEcgStreaming(deviceId, settings: settings)
            }
            .subscribe(
                onNext: { [weak self] ecgData in
                    guard let self = self else { return }
                    
                    var samples: [[String: Any]] = []
                    for sample in ecgData {
                        samples.append([
                            "timeStamp": sample.timeStamp,
                            "voltage": sample.voltage,
                        ])
                    }
                    
                    self.emit("PolarEcgData", body: [
                        "deviceId": deviceId,
                        "samples": samples,
                        "timestamp": Int(Date().timeIntervalSince1970 * 1000),
                    ])
                },
                onError: { [weak self] error in
                    NSLog("[PolarBle] ❌ ECG streaming error for device \(deviceId): \(error.localizedDescription)")
                    self?.ecgStreamingDisposables.removeValue(forKey: deviceId)
                },
                onCompleted: { [weak self] in
                    NSLog("[PolarBle] ECG streaming completed for device: \(deviceId)")
                    self?.ecgStreamingDisposables.removeValue(forKey: deviceId)
                }
            )
        
        ecgStreamingDisposables[deviceId] = ecgDisposable
        resolve(true)
    }
    
    @objc func stopEcgStreaming(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        NSLog("[PolarBle] Stopping ECG streaming for device: \(deviceId)")
        
        if let disposable = ecgStreamingDisposables[deviceId] {
            disposable.dispose()
            ecgStreamingDisposables.removeValue(forKey: deviceId)
        }
        
        resolve(true)
    }
}

// MARK: - PolarBleApiObserver
extension PolarBleModule: PolarBleApiObserver {
    func deviceConnecting(_ polarDeviceInfo: PolarDeviceInfo) {
        NSLog("[PolarBle] Device connecting: \(polarDeviceInfo.deviceId) - \(polarDeviceInfo.name)")
        emit("PolarDeviceConnecting", body: [
            "deviceId": polarDeviceInfo.deviceId,
            "name": polarDeviceInfo.name,
        ])
    }
    
    func deviceConnected(_ polarDeviceInfo: PolarDeviceInfo) {
        NSLog("[PolarBle] ✅ Device connected: \(polarDeviceInfo.deviceId) - \(polarDeviceInfo.name)")
        emit("PolarDeviceConnected", body: [
            "deviceId": polarDeviceInfo.deviceId,
            "name": polarDeviceInfo.name,
        ])
    }
    
    func deviceDisconnected(_ polarDeviceInfo: PolarDeviceInfo, pairingError: Bool) {
        let errorReason = pairingError ? "配对失败" : "正常断开"
        NSLog("[PolarBle] ❌ Device disconnected: \(polarDeviceInfo.deviceId) - \(polarDeviceInfo.name), reason: \(errorReason)")
        
        if let disposable = hrStreamingDisposables[polarDeviceInfo.deviceId] {
            disposable.dispose()
            hrStreamingDisposables.removeValue(forKey: polarDeviceInfo.deviceId)
        }
        
        if let disposable = ecgStreamingDisposables[polarDeviceInfo.deviceId] {
            disposable.dispose()
            ecgStreamingDisposables.removeValue(forKey: polarDeviceInfo.deviceId)
        }
        
        emit("PolarDeviceDisconnected", body: [
            "deviceId": polarDeviceInfo.deviceId,
            "name": polarDeviceInfo.name,
            "pairingError": pairingError,
        ])
    }
}

// MARK: - PolarBleApiPowerStateObserver
extension PolarBleModule: PolarBleApiPowerStateObserver {
    func blePowerOn() {
        NSLog("[PolarBle] 📶 BLE Power ON")
    }
    
    func blePowerOff() {
        NSLog("[PolarBle] ⚠️ BLE Power OFF")
    }
}

// MARK: - PolarBleApiDeviceInfoObserver
extension PolarBleModule: PolarBleApiDeviceInfoObserver {
    func batteryLevelReceived(_ identifier: String, batteryLevel: UInt) {
        NSLog("[PolarBle] Battery level: \(identifier) = \(batteryLevel)%")
        emit("PolarBatteryLevel", body: [
            "deviceId": identifier,
            "batteryLevel": batteryLevel,
        ])
    }
    
    func batteryChargingStatusReceived(_ identifier: String, chargingStatus: BleBasClient.ChargeState) {
        NSLog("[PolarBle] Battery charging status: \(identifier) status: \(chargingStatus)")
    }
    
    func disInformationReceived(_ identifier: String, uuid: CBUUID, value: String) {
        NSLog("[PolarBle] DIS info: \(identifier) uuid: \(uuid.uuidString) value: \(value)")
    }
    
    func disInformationReceivedWithKeysAsStrings(_ identifier: String, key: String, value: String) {
        NSLog("[PolarBle] DIS info with keys: \(identifier) key: \(key) value: \(value)")
    }
}

// MARK: - PolarBleApiDeviceFeaturesObserver
extension PolarBleModule: PolarBleApiDeviceFeaturesObserver {
    func bleSdkFeatureReady(_ identifier: String, feature: PolarBleSdkFeature) {
        NSLog("[PolarBle] Feature ready: \(identifier) feature: \(feature)")
    }
}

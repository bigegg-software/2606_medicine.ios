declare module 'react-native-health' {
  const AppleHealthKit: {
    Constants: {
      Permissions: Record<string, string>;
    };
    initHealthKit: (
      permissions: { permissions: { read: string[]; write: string[] } },
      callback: (error: string) => void,
    ) => void;
    getRestingHeartRate: (options: HealthOptions, callback: HealthCallback) => void;
    getSleepSamples: (options: HealthOptions, callback: HealthCallback) => void;
    getBasalEnergyBurned: (options: HealthOptions, callback: HealthCallback) => void;
    getStepCount: (options: { date: string }, callback: HealthValueCallback) => void;
    getElectrocardiogramSamples: (options: HealthOptions, callback: HealthCallback) => void;
    getHeartRateVariabilitySamples: (options: HealthOptions, callback: HealthCallback) => void;
    getOxygenSaturationSamples: (options: HealthOptions, callback: HealthCallback) => void;
    getDistanceWalkingRunning: (options: { date: string }, callback: HealthValueCallback) => void;
    getActiveEnergyBurned: (options: HealthOptions, callback: HealthCallback) => void;
    getAppleExerciseTime: (options: HealthOptions, callback: HealthCallback) => void;
    getHeartRateSamples: (options: HealthOptions, callback: HealthCallback) => void;
  };
  export default AppleHealthKit;
}

type HealthOptions = {
  startDate: string;
  endDate: string;
};

type HealthCallback = (error: string, results: Record<string, unknown>[]) => void;

type HealthValueCallback = (error: string, results: Record<string, unknown>) => void;

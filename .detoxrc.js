module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'detox.config.js',
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/detox.setup.js'],
      testMatch: ['<rootDir>/__tests__/e2e/**/*.test.ts'],
      testTimeout: 120000,
      maxWorkers: 1,
      globalSetup: 'detox/runners/jest/globalSetup',
      globalTeardown: 'detox/runners/jest/globalTeardown',
      reporters: ['detox/runners/jest/reporter'],
      testEnvironment: 'detox/runners/jest/testEnvironment',
      verbose: true,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'android.emulator',
      device: {
        avdName: 'pixel_5_api_31',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'simulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'simulator',
      app: 'android.release',
    },
    'android.attached.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.attached.release': {
      device: 'attached',
      app: 'android.release',
    },
  },
};
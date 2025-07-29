// Jest setup file for expo-termux tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {},
  NativeEventEmitter: jest.fn(),
  Platform: {
    OS: 'android',
  },
}));

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));
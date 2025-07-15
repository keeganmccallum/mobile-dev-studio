/**
 * Jest setup file for React Native testing
 */

require('react-native-gesture-handler/jestSetup');

// Mock React Native modules that are needed for unit tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock React Native WebView for unit tests
jest.mock('react-native-webview', () => ({
  WebView: jest.fn(() => null),
}));

// Mock React Navigation for unit tests
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Expo modules for unit tests
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock AsyncStorage for unit tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Only mock React Native modules for unit tests, not integration tests
const testPath = expect.getState().testPath;
const isUnitTest = testPath && testPath.includes('__tests__/unit/');

if (isUnitTest) {
  // Mock React Native modules for unit tests only
  jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    
    // Mock NativeModules for unit tests
    RN.NativeModules = {
      ...RN.NativeModules,
      TermuxCore: {
        createSession: jest.fn(),
        killSession: jest.fn(),
        writeToSession: jest.fn(),
        readFromSession: jest.fn(),
        getBootstrapInfo: jest.fn(),
        installBootstrap: jest.fn(),
      },
    };

    // Mock NativeEventEmitter for unit tests
    RN.NativeEventEmitter = jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
    }));

    // Mock Platform for unit tests
    RN.Platform = {
      ...RN.Platform,
      OS: 'android',
      Version: 31,
      select: jest.fn((obj) => obj.android || obj.default),
    };

    return RN;
  });
}

// Suppress console output in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test utilities
global.TestUtils = {
  flushPromises: () => new Promise(setImmediate),
  waitForAsync: (fn) => {
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    }).then(fn);
  },
};

// Setup and cleanup
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
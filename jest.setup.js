/**
 * Jest setup file for React Native testing
 */

// Mock React Native modules that are needed for unit tests
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch (error) {
  // Ignore if module doesn't exist
}

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

// Suppress console output in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup and cleanup
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});
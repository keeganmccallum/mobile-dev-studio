// Jest setup file

// Mock Expo modules
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {
    TermuxCore: {
      getBootstrapInfo: jest.fn(),
      installBootstrap: jest.fn(),
      createSession: jest.fn(),
      writeToSession: jest.fn(),
      killSession: jest.fn(),
    }
  },
  requireNativeViewManager: jest.fn(() => 'MockedNativeView'),
}));

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'android',
      select: jest.fn((obj) => obj.android),
    },
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'MockedWebView',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'MockedIonicons',
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock setTimeout for tests
global.setTimeout = jest.fn((fn) => fn()) as any;
// Node.js Jest setup file for CI testing

// Mock React Native components as simple objects
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: "android",
    select: jest.fn((obj) => obj.android),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/documents/",
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

// Mock expo-modules-core
jest.mock("expo-modules-core", () => ({
  NativeModulesProxy: {
    TermuxCore: {
      getBootstrapInfo: jest.fn(),
      installBootstrap: jest.fn(),
      createSession: jest.fn(),
      writeToSession: jest.fn(),
      killSession: jest.fn(),
    },
  },
  requireNativeViewManager: jest.fn(() => "MockedNativeView"),
}));

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock react-navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
}));

// Mock react-native-webview
jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

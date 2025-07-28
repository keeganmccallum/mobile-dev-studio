# expo-termux

**A powerful Termux integration package for Expo applications, enabling full terminal functionality within React Native apps.**

[![Build Status](https://github.com/keeganmccallum/mobile-dev-studio/actions/workflows/build-release.yml/badge.svg)](https://github.com/keeganmccallum/mobile-dev-studio/actions)
[![APK Validation](https://github.com/keeganmccallum/mobile-dev-studio/actions/workflows/apk-validation.yml/badge.svg)](https://github.com/keeganmccallum/mobile-dev-studio/actions)

## 🎯 Overview

This monorepo contains the `@keeganmccallum/expo-termux` npm package that provides seamless Termux integration for any Expo application. The package includes:

- **Native Android Termux implementation** with full terminal emulation
- **React Native bridge** for JavaScript/TypeScript integration  
- **WebView-based terminal** using xterm.js for rich UI
- **Session management** for multiple concurrent terminal sessions
- **Bootstrap installation** for automatic Termux environment setup

## 📦 Package Structure

```
expo-termux/
├── packages/
│   ├── expo-termux/           # 📦 Main npm package (for publication)
│   └── demo-app/              # 🎯 Demo application showcasing functionality
├── modules/
│   └── termux-core/           # 🔧 Native Android Termux implementation
└── .github/workflows/         # ⚙️ CI/CD and testing infrastructure
```

## 🚀 Current Status

### ✅ **Working Features**

| Component | Status | Description |
|-----------|--------|-------------|
| **Package Build** | ✅ Working | TypeScript compilation and npm package creation |
| **Native Module** | ✅ Working | Android Termux core implementation compiles |
| **APK Build** | ✅ Working | Demo app builds successfully for Android |
| **Expo Integration** | ✅ Working | Auto-linking and plugin configuration |
| **WebView Terminal** | ✅ Working | xterm.js integration for terminal UI |
| **Development Workflow** | ✅ Working | 3-tier testing strategy (3min/10min/20min) |

### 🚧 **In Development**

| Component | Status | Description |
|-----------|--------|-------------|
| **App Launch** | ❌ **Critical Issue** | App crashes immediately on startup |
| **Session Management** | 🔄 Pending | Waiting for app launch fix |
| **Terminal Emulation** | 🔄 Pending | Waiting for app launch fix |
| **File System Access** | 🔄 Pending | Waiting for app launch fix |
| **Bootstrap Installation** | 🔄 Pending | Waiting for app launch fix |

### 🎯 **Planned Features**

- **Package Publishing** - Publish to npm registry as `@keeganmccallum/expo-termux`
- **Multi-SDK Support** - Support for Expo SDK 50, 51, 52, 53
- **iOS Support** - Cross-platform terminal functionality
- **Advanced Terminal Features** - Themes, fonts, key bindings
- **Plugin Ecosystem** - Extensions for additional functionality

## 📱 Demo Application Features

The demo app (`packages/demo-app`) showcases all expo-termux functionality:

### **Tab Navigation**

1. **🖥️ Terminal Tab**
   - Full terminal emulation using xterm.js
   - **Status**: 🔄 Waiting for app launch fix
   
2. **📝 Editor Tab**  
   - Code editor with syntax highlighting
   - WebView-based Monaco Editor integration
   - **Status**: 🔄 Waiting for app launch fix

3. **👁️ Preview Tab**
   - Live preview functionality  
   - Web server integration for development
   - **Status**: 🔄 Waiting for app launch fix

4. **⚡ Termux Demo Tab**
   - Native Termux feature demonstration
   - Session management UI
   - Command execution testing
   - **Status**: 🔄 Waiting for app launch fix

### **Core Functionality**

#### **TermuxManager** - Session Management
```typescript
import { termuxManager } from '@keeganmccallum/expo-termux';

// Create a new terminal session
const sessionId = await termuxManager.createSession({
  command: '/data/data/com.termux/files/usr/bin/bash',
  cwd: '/data/data/com.termux/files/home',
  environment: { HOME: '/data/data/com.termux/files/home' }
});

// Write to session
await termuxManager.writeToSession(sessionId, 'ls -la\n');

// Listen for output
const unsubscribe = termuxManager.onSessionOutput((sessionId, lines) => {
  console.log(`Session ${sessionId}:`, lines.join('\n'));
});
```

#### **TermuxCore** - Legacy API
```typescript
import { TermuxCore } from '@keeganmccallum/expo-termux';

// Check bootstrap installation
const info = await TermuxCore.getBootstrapInfo();
console.log('Bootstrap installed:', info.installed);

// Install bootstrap if needed
if (!info.installed) {
  const success = await TermuxCore.installBootstrap();
  console.log('Bootstrap installation:', success ? 'Success' : 'Failed');
}
```

#### **Components** - UI Integration
```tsx
import { TermuxTerminalView, XTermWebTerminal } from '@keeganmccallum/expo-termux';

// Native terminal view
<TermuxTerminalView
  style={{ flex: 1 }}
  onSessionCreate={(sessionId) => console.log('Session created:', sessionId)}
  onOutput={(data) => console.log('Output:', data)}
/>

// Web-based terminal with xterm.js
<XTermWebTerminal
  style={{ flex: 1 }}
  theme="dark"
  fontSize={14}
  onData={(data) => handleTerminalInput(data)}
/>
```

## 🛠️ Installation

### **For End Users** (When Published)

```bash
# Install the package
npm install @keeganmccallum/expo-termux

# Install peer dependencies
npm install react-native-webview
```

Add to your `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@keeganmccallum/expo-termux",
      "react-native-webview"
    ]
  }
}
```

### **For Development**

```bash
# Clone the repository
git clone https://github.com/keeganmccallum/mobile-dev-studio.git
cd mobile-dev-studio

# Install dependencies
npm install

# Build the package
npm run build:package

# Run demo app
npm run android:demo
```

## 🧪 Testing & Development

This project uses a **3-tier testing strategy** for efficient development:

### **🟢 Tier 1: Quick Validation (2-3 minutes)**
```bash
gh workflow run "Quick Validation Pipeline"
```
- TypeScript compilation check
- Bundle creation validation
- Native module compilation check
- App configuration validation

### **🟡 Tier 2: Debug Build (7-10 minutes)**
```bash
gh workflow run "Debug APK Build with Enhanced Logging"
```
- Full APK build with debug information
- Enhanced crash logging and source maps
- Automatic APK validation trigger

### **🔴 Tier 3: Full Production Test (15-20 minutes)**
```bash
gh workflow run "Build and Release APKs"
gh workflow run "APK Validation Testing"
```
- Production APK builds (debug + release)
- Complete emulator testing with screenshots
- Full functionality validation

### **Development Workflow**
```bash
# Quick iteration cycle
git add . && git commit -m "Feature: description"
gh workflow run "Quick Validation Pipeline"  # 3 minutes

# Debug runtime issues  
gh workflow run "Debug APK Build"            # 10 minutes

# Final validation
gh workflow run "Build and Release APKs"     # 20 minutes
```

## 🐛 Current Issues

### **Critical Issue: Immediate App Crash**

**Problem**: The demo app builds successfully but crashes immediately on launch before any JavaScript code executes.

**Status**: 🔍 **Under Investigation**

**Debugging Approach**:
1. ✅ Enhanced crash logging implemented (`CrashLogger`)
2. ✅ Debug builds with verbose native logging  
3. ✅ Comprehensive logcat capture in emulator testing
4. 🔄 Root cause analysis in progress

**Suspected Causes**:
- Native module initialization failure (expo-termux)
- React Native engine configuration issues
- Expo auto-linking problems
- Dependency version conflicts

**Debug Artifacts Available**:
- Full launch logs with native crash detection
- System properties and memory analysis  
- Package installation verification
- Complete Android runtime logs

## 🤝 Contributing

### **Development Environment**

This project is developed entirely through GitHub Actions due to Android Termux environment constraints:

- ❌ **No local emulator** - All testing via remote GitHub Actions
- ❌ **No local builds** - APK compilation on GitHub runners only
- ✅ **Remote validation** - Emulator testing with screenshot capture
- ✅ **Enhanced debugging** - Comprehensive crash logging and analysis

### **Contribution Workflow**

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/awesome-feature`
3. **Test with Quick Validation**: `gh workflow run "Quick Validation Pipeline"`
4. **Debug if needed**: `gh workflow run "Debug APK Build"`  
5. **Create pull request** with emulator test results

### **Pull Request Requirements**

- ✅ Quick Validation pipeline passes
- ✅ Debug build completes successfully
- ✅ APK validation screenshots show expected behavior
- ✅ Code follows TypeScript/React Native best practices
- ✅ Documentation updated for new features

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Termux Project** - Foundation for Android terminal functionality
- **xterm.js** - Web-based terminal emulation
- **Expo Team** - React Native and native module framework
- **React Navigation** - Navigation framework for demo app

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/keeganmccallum/mobile-dev-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/keeganmccallum/mobile-dev-studio/discussions)
- **CI/CD Status**: [GitHub Actions](https://github.com/keeganmccallum/mobile-dev-studio/actions)

---

**⚡ Goal**: Create a bulletproof, well-tested, drop-in Termux integration that works in any Expo application with minimal configuration.

**🎯 Target**: Full functionality validation with 90%+ success rate on automated testing.
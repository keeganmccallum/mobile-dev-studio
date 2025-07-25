# Mobile Dev Studio - Termux Integration Monorepo

This monorepo contains the `@keeganmccallum/expo-termux` package and a demo application showcasing its functionality.

> 🚀 **Drop-in Termux integration for Expo applications with automatic configuration**

[![CI/CD Pipeline](https://github.com/mobile-dev-studio/mobile-dev-studio/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/mobile-dev-studio/mobile-dev-studio/actions)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/mobile-dev-studio/mobile-dev-studio/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📦 Packages

### [@keeganmccallum/expo-termux](./packages/expo-termux/)
Drop-in Termux integration package for Expo applications with automatic configuration.

**Features:**
- 🚀 Zero-config installation with automatic Kotlin version compatibility
- 📱 Native Android Termux backend integration  
- 🖥️ xterm.js terminal UI components
- 🔧 Multiple terminal sessions with command execution
- ⚡ Minimal setup for fresh Expo projects

### [Demo App](./packages/demo-app/)
Example Expo application demonstrating all expo-termux features including:
- Terminal interface with xterm.js
- Session management and programmatic control
- Command execution examples
- Multiple tab navigation showing integration

## 🚀 Quick Start

### For Package Development

\`\`\`bash
# Install dependencies
pnpm install

# Build the expo-termux package
pnpm build:package

# Start package development (watch mode)
pnpm dev:package

# Start demo app  
pnpm dev:demo

# Build and test on Android
pnpm android:demo
\`\`\`

### For Using the Package

\`\`\`bash
npm install @keeganmccallum/expo-termux
\`\`\`

Add to your \`app.json\`:
\`\`\`json
{
  "expo": {
    "plugins": ["@keeganmccallum/expo-termux"]
  }
}
\`\`\`

Use in your React Native app:
\`\`\`tsx
import React from 'react';
import { TermuxTerminal } from '@keeganmccallum/expo-termux';

export default function App() {
  return (
    <TermuxTerminal 
      sessionId="main"
      onData={(data) => console.log('Output:', data)}
      onExit={(code) => console.log('Exit code:', code)}
    />
  );
}
\`\`\`

## ✨ Original Features

### ⚡ Real Terminal Integration
- **Actual Termux Terminal**: Complete Linux environment with 29MB Alpine bootstrap
- **Native Performance**: Direct Android PTY integration for maximum speed  
- **Full Command Support**: bash, npm, git, node, python, and 1000+ packages
- **Real Subprocess Execution**: Fork/execvp with actual process management

### 🌐 Live Preview
- **Development Server Integration**: Auto-connects to npm/yarn dev servers
- **Real-time Updates**: See changes instantly as you code
- **Server Status Sync**: Coordinated status between Terminal and Preview tabs
- **WebView Integration**: Full browser environment for testing

### 📝 Code Editor  
- **Syntax Highlighting**: Support for multiple programming languages
- **File Management**: Integrated file browser and editor
- **Mobile Optimized**: Touch-friendly interface designed for mobile

### 🔄 Unified Workflow
- **3-Tab Architecture**: Editor → Terminal → Preview seamless workflow
- **Cross-tab Communication**: Real-time status updates between components
- **State Persistence**: Maintains sessions across tab switches

## 🏗 Architecture

```
Mobile Dev Studio (Expo React Native)
├── 📝 Editor Tab
│   ├── File Browser
│   ├── Code Editor  
│   └── Syntax Highlighting
├── ⚡ Terminal Tab (Real Termux UI)
│   ├── TermuxTerminalView (Native Android Component)
│   ├── Termux Bootstrap (29MB Alpine Linux)
│   ├── Real PTY Subprocess Execution
│   ├── Native Session Management
│   └── Complete Linux Environment
└── 🌐 Preview Tab
    ├── Development Server Integration
    ├── Live WebView
    ├── Server Status Monitoring
    └── Auto-refresh on Server Start
```

### Core Technologies
- **React Native + Expo**: Cross-platform mobile framework
- **Real Termux Integration**: Actual Termux terminal components
- **Kotlin/C++ Native Modules**: Direct PTY and subprocess management
- **Alpine Linux Bootstrap**: Complete 29MB Linux environment
- **WebView**: Live preview with development server integration

## 🛠 Installation & Setup

### Prerequisites
- Android 7.0+ (API level 24+)
- 2GB+ RAM recommended
- 1GB+ storage space for Linux bootstrap

### Development Setup
```bash
# Clone repository
git clone https://github.com/mobile-dev-studio/mobile-dev-studio.git
cd mobile-dev-studio

# Install dependencies (includes termux-core native module)
npm install

# Start development server
npm start

# Run on Android
npm run android
```

### Native Module Setup
The app includes a custom `termux-core` native module that:
- Bundles the complete Termux bootstrap (29MB Alpine Linux)
- Provides native Android terminal components
- Handles real subprocess execution with PTY
- Manages terminal sessions and process lifecycle

## 🧪 Testing

### Test Structure
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: Cross-component workflow testing  
- **E2E Tests**: Complete user journey testing

### Run Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Coverage
- TermuxCore native module integration
- Terminal service process management
- Real terminal component rendering
- Cross-tab communication workflows
- Development server integration

## 🚀 Key Components

### TermuxCore Native Module
- **Location**: `modules/termux-core/`
- **Purpose**: Real Termux terminal integration
- **Components**:
  - `TermuxCoreModule.kt`: Main native module interface
  - `TermuxTerminalView`: React Native wrapper for actual Termux terminal
  - `termux-core.cpp`: C++ PTY and subprocess management
  - Bootstrap installation and session management

### Terminal Service
- **File**: `src/services/TerminalService.ts`
- **Purpose**: Manages terminal sessions and processes
- **Features**:
  - Real subprocess creation with environment setup
  - Session lifecycle management
  - Server status tracking and cross-tab communication
  - Process I/O handling

### Real Termux Terminal Component
- **File**: `src/components/RealTermuxTerminal.tsx`
- **Purpose**: React Native component using actual Termux UI
- **Integration**: Direct rendering of native Termux terminal view

## 📊 CI/CD Pipeline

### Automated Workflows
- **CI Pipeline**: Lint, typecheck, tests on every PR
- **Security Scan**: CodeQL analysis and dependency review
- **Build**: Android APK generation for releases
- **Dependency Updates**: Weekly automated dependency updates

### Quality Gates
- ESLint code quality checks
- TypeScript compilation verification
- Unit and integration test coverage
- Security vulnerability scanning

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Create Pull Request

### Code Style
- TypeScript for all new code
- ESLint configuration compliance
- Test coverage for new features
- Conventional commit messages

## 📄 Project Structure

```
mobile-dev-studio/
├── src/                     # React Native source
│   ├── components/          # UI components
│   ├── screens/             # Main screens (Editor, Terminal, Preview)
│   ├── services/            # Business logic
│   └── __tests__/           # Test setup
├── modules/                 # Native modules
│   └── termux-core/         # Real Termux integration
│       ├── android/         # Kotlin/C++ native code
│       └── src/             # TypeScript interface
├── __tests__/               # Test suites
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests  
│   └── e2e/                 # End-to-end tests
├── assets/                  # Static assets
│   └── termux/              # Termux bootstrap files
└── .github/                 # CI/CD workflows
```

## 🎯 Real Termux Integration Details

### What Makes This Special
Unlike terminal simulators, this app integrates **actual Termux components**:

1. **Real Terminal UI**: Uses Termux's `TerminalView` component directly
2. **Complete Bootstrap**: Bundles the full 29MB Alpine Linux environment
3. **Native Subprocess**: Real fork()/execvp() with PTY for authentic terminal behavior
4. **Session Management**: Actual terminal sessions with process lifecycle management
5. **Development Integration**: Real npm/node commands that Preview tab can connect to

### Bootstrap Installation
- Automatic extraction of 29MB Alpine Linux environment
- Complete package manager (apk) with 1000+ packages
- Real development tools: node, npm, git, python, gcc, etc.
- Persistent file system with proper Linux directory structure

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Termux Team**: For the incredible Android terminal emulator
- **Expo Team**: For the amazing React Native framework  
- **React Native Community**: For the robust mobile development ecosystem

---

**Built with ❤️ for mobile developers who want a complete development environment in their pocket**
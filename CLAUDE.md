# Claude Code Development Guide

## Project Architecture - CRITICAL UNDERSTANDING

**THIS IS A MONOREPO FOR THE `expo-termux` NPM PACKAGE**

- 📦 **Primary Goal**: Create a publishable `expo-termux` npm package that provides Termux integration for any Expo app
- 🎯 **Demo App**: `packages/demo-app` showcases the expo-termux package functionality
- 🔧 **Native Modules**: `modules/termux-core` contains the native Android implementation
- ⚙️ **Build Process**: Root-level builds create APKs of the demo app using the expo-termux package

### Key Components:
1. **`packages/expo-termux/`** - The main npm package (to be published) - **STANDARD EXPO MODULE**
2. **`packages/demo-app/`** - Demo application showcasing expo-termux features
3. **`packages/expo-termux/android/`** - Native Android implementation (standard Expo structure)
4. **Root Level** - Monorepo build configuration and demo app compilation

**CRITICAL: expo-termux MUST work exactly like any standard Expo module (expo-camera, expo-media-library, etc.)**
**NEVER use custom module registration - only standard Expo autolinking**

### Architecture Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXPO-TERMUX MONOREPO                          │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   Demo App      │    │   expo-termux   │    │    termux-core          │  │
│  │ packages/demo-  │    │   packages/     │    │   modules/termux-core/  │  │
│  │     app/        │    │  expo-termux/   │    │                         │  │
│  │                 │    │                 │    │                         │  │
│  │  ┌─────────────┐│    │ ┌─────────────┐ │    │ ┌─────────────────────┐ │  │
│  │  │TermuxDemo   ││    │ │TermuxManager│ │    │ │ ExpoTermuxModule.kt │ │  │
│  │  │Screen.tsx   ││───▶│ │    .ts      │ │───▶│ │ (STANDARD EXPO)     │ │  │
│  │  │             ││    │ │             │ │    │ │ TermuxSessionFallback│ │  │
│  │  │- Create     ││    │ │- Session    │ │    │ │                     │ │  │
│  │  │  Session    ││    │ │  Management │ │    │ │- Native Termux      │ │  │
│  │  │- Execute    ││    │ │- Command    │ │    │ │  Implementation     │ │  │
│  │  │  Commands   ││    │ │  Execution  │ │    │ │- Process Management │ │  │
│  │  │- Display    ││    │ │- Event      │ │    │ │- File System       │ │  │
│  │  │  Output     ││    │ │  Handling   │ │    │ │- Bootstrap Install  │ │  │
│  │  └─────────────┘│    │ └─────────────┘ │    │ └─────────────────────┘ │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                         │              │
│           │                       │                         │              │
│   ┌───────▼──────────────────────▼────────────────────────▼──────────┐   │
│   │                        React Native Bridge                      │   │
│   │                   NativeModulesProxy.ExpoTermux                │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        Build Configuration                          │  │
│   │                                                                     │  │
│   │  app.json:                   android/settings.gradle:              │  │
│   │  plugins: [                  include ':termux-core'                │  │
│   │    "@keeganmccallum/          project(':termux-core').projectDir =  │  │
│   │     expo-termux"             File('../modules/termux-core/android') │  │
│   │  ]                                                                  │  │
│   │                              android/app/build.gradle:              │  │
│   │  Auto-linking via:           implementation project(':termux-core') │  │
│   │  - Expo plugin system                                               │  │
│   │  - Metro bundler                                                    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PUBLISHED PACKAGE USAGE                          │
│                                                                             │
│   ┌─────────────────┐                    ┌─────────────────────────────────┐ │
│   │  End User App   │                    │     @keeganmccallum/expo-termux │ │
│   │                 │                    │        (Published Package)      │ │
│   │  app.json:      │                    │                                 │ │
│   │  plugins: [     │                    │  ┌─────────────────────────────┐ │ │
│   │    "@keeganmc-  │───── npm install ──▶│  │        TermuxManager        │ │ │
│   │     callum/     │                    │  │        TermuxCore           │ │ │
│   │     expo-termux"│                    │  │        Native Modules       │ │ │
│   │  ]              │                    │  │        Plugin Config        │ │ │
│   │                 │                    │  └─────────────────────────────┘ │ │
│   │  import {       │                    │                                 │ │
│   │   termuxManager │◀─── Auto-linked ───│  Built from monorepo and        │ │
│   │  } from '@kee-  │                    │  published to npm registry      │ │
│   │   ganmccallum/  │                    │                                 │ │
│   │   expo-termux'  │                    │                                 │ │
│   └─────────────────┘                    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

Key Integration Points:
━━━━━━━━━━━━━━━━━━━━━

1. **JavaScript Layer**: 
   - Demo app imports TermuxManager from local expo-termux package
   - End users import from published npm package

2. **React Native Bridge**: 
   - TermuxManager calls NativeModulesProxy.ExpoTermux (STANDARD EXPO)
   - Event emitters handle session output/exit events

3. **Native Module Registration**:
   - NO expo-module.config.json needed (modern Expo autolinking)
   - Standard package structure: expo.modules.expotermux.ExpoTermuxModule
   - Module name: "ExpoTermux" (simple and standard)

4. **Build System Integration**:
   - Expo plugin auto-configures Android build settings
   - Metro bundler handles JavaScript/TypeScript compilation
   - Gradle builds native Android modules using STANDARD EXPO MODULE structure

5. **Auto-linking Chain**:
   - app.json plugins → Expo plugin system → Gradle dependencies
   - Package dependencies → Metro resolution → AUTOMATIC module discovery
   - **NO MANUAL CONFIGURATION REQUIRED** (like expo-camera)
```

## 🚨 CRITICAL: Standard Expo Module Architecture (LOCKED IN)

**expo-termux MUST work exactly like any other standard Expo module. No exceptions.**

### Standard Module Structure (REQUIRED):
```
packages/expo-termux/
├── package.json                    # Standard Expo module package
├── plugin/index.js                 # Expo plugin for auto-config
├── src/
│   ├── index.ts                    # JavaScript exports
│   └── TermuxManager.ts            # Main API
├── android/
│   ├── build.gradle                # Standard Android library
│   └── src/main/java/expo/modules/expotermux/
│       ├── ExpoTermuxModule.kt     # STANDARD EXPO MODULE
│       └── TermuxSessionFallback.kt
└── NO expo-module.config.json      # Modern autolinking only
```

### Critical Requirements:
- ✅ **Module class**: `ExpoTermuxModule : Module()`
- ✅ **Package**: `expo.modules.expotermux`
- ✅ **Module name**: `Name("ExpoTermux")`
- ✅ **JavaScript access**: `NativeModulesProxy.ExpoTermux`
- ❌ **NO manual registration files**
- ❌ **NO custom build configurations**

### User Experience (MUST be this simple):
```bash
npm install @keeganmccallum/expo-termux
# Add plugin to app.json
import { termuxManager } from '@keeganmccallum/expo-termux'
```

**If it's more complex than expo-camera, it's wrong.**

## Development Environment Context

**CRITICAL: Claude Code is running on Android phone in Termux environment**

- ❌ **No local emulator access** - Cannot run Android emulators locally
- ❌ **No local build capability** - Must use GitHub Actions for all builds
- ❌ **No direct APK testing** - Cannot install/test APKs locally
- ✅ **GitHub Actions only** - All testing must be done via GitHub Actions workflows
- ✅ **Remote emulator testing** - APK Validation Testing workflow is the only way to test

## 🧪 Comprehensive Testing Strategy (Test Pyramid)

### **Tier 1: Unit Tests (Fast - seconds)**
- **Location**: `packages/expo-termux/src/__tests__/`
- **Coverage**: TypeScript/JavaScript business logic
- **Tools**: Jest, ts-jest
- **Commands**:
  ```bash
  cd packages/expo-termux && npm run test:unit
  npm run test:coverage  # Generate coverage reports
  ```

### **Tier 2: Integration Tests (Medium - minutes)**
- **Location**: `packages/expo-termux/src/__tests__/integration/`
- **Coverage**: Native bridge communication, API contracts
- **Tools**: Jest with React Native mocks
- **Commands**:
  ```bash
  cd packages/expo-termux && npm run test:integration
  ```

### **Tier 3: APK Validation Tests (Slow - 10-20 minutes)**
- **Location**: `.github/workflows/apk-validation.yml`
- **Coverage**: Full app functionality on real emulator
- **Tools**: Android emulator, UI automation
- **Enhanced Termux Testing**:
  - Session creation testing (08-create-session-test.png)
  - Command execution validation (09-execute-pwd-test.png, 10-execute-ls-test.png, 11-execute-echo-test.png)
  - Output capture verification (termux-window-dump.txt)
  - Fallback implementation testing

## Critical Testing Workflow

### NEVER CLAIM SUCCESS WITHOUT ACTUAL TESTING

**The comprehensive testing approach:**

1. **Unit Tests**: `npm run test:unit` (if possible locally)
2. **Build APK**: `gh run list --workflow="Build and Release APKs"`
3. **Test APK**: `gh workflow run "APK Validation Testing"`
4. **Check Results**: `gh run list --workflow="APK Validation Testing" --limit 1`
5. **Download Logs**: `gh run download [RUN_ID] --name apk-validation-debug-artifacts`
6. **Analyze Results**: Check screenshots + test coverage

### APK Validation Testing Pipeline

The emulator test runs these comprehensive steps:
- ✅ **Install APK** → Basic APK integrity and package verification
- ✅ **Launch App** → Dynamic package detection and launch
- ✅ **Check Process** → Verify app process is running
- ✅ **Navigate to Termux Tab** → Test UI navigation to Termux Features
- ✅ **Test Termux Session Creation** → Click "Create New Session" button
- ✅ **Validate Native Module** → Detect TermuxCore native module errors
- ✅ **Screenshots** → Capture each step including error states
- ✅ **Crash Detection** → Any missing screenshots = crash at that point
- ✅ **Functionality Validation** → Tests fail if Termux integration doesn't work

### Test Result Interpretation

**Successful run produces these screenshots:**
- `00-clean-state.png` - Emulator before install
- `01-post-install.png` - After APK installation
- `02-app-launched.png` - App successfully started
- `03-app-loaded.png` - App fully loaded
- `04-termux-tab.png` - Termux Features tab navigation
- `05-create-session-test.png` - Termux session creation test
- `06-session-created.png` - Session created successfully
- `07-session-validation.png` - Session validation complete

**Failed Termux integration produces:**
- `06-termux-error.png` - Screenshot of native module error dialog
- `termux-error.log` - Detailed error information from system dumps

**If only `00-clean-state.png` exists** = **IMMEDIATE CRASH ON LAUNCH**

### Commands for Testing Loop

```bash
# 1. Trigger APK validation
gh workflow run "APK Validation Testing"

# 2. Check status (repeat until completed)  
gh run list --workflow="APK Validation Testing" --limit 1

# 3. Download failure artifacts
gh run download [RUN_ID] --name apk-validation-debug-artifacts

# 4. Check what screenshots exist
ls -la *.png

# 5. If crash logs exist, examine them
find . -name "*crash*" -o -name "*log*"
```

### Current App Status (Updated August 2, 2025)

- **JavaScript Bundle**: ✅ Builds successfully  
- **APK Build**: ✅ All builds completing successfully
- **App Launch**: ✅ **FIXED** - App launches and runs perfectly
- **Navigation**: ✅ **FIXED** - All screens and tabs working
- **UI Components**: ✅ **FIXED** - Terminal, Editor, Preview tabs working
- **Native Module**: ✅ **REAL TERMUX IMPLEMENTATION** - Using actual com.termux.terminal libraries
- **Build System**: ✅ **FIXED** - Termux dependencies properly included and compiling
- **Root Issue**: ⚠️ **RELEASE CREATION FAILING** - APKs build successfully but GitHub release creation fails due to missing artifacts directory

### CRITICAL REMINDER: GitHub Release Creation Issue

**Problem**: Recent builds show APKs compile successfully (both debug and release), but the create-release job fails with:
```
find: 'artifacts/': No such file or directory  
Process completed with exit code 1.
```

**Impact**: No new releases are being created despite successful APK builds.

**Root Cause**: The create-release job expects APK artifacts to be available but the artifacts directory is missing or not properly uploaded from the Android build jobs.

**Required Fix**: Investigate and fix the artifact upload/download chain between build-android jobs and create-release job in `.github/workflows/build-release.yml`

### Development Loop Optimizations (August 2, 2025)

**APK Validation Timeout**: Set to 10 minutes maximum (was 45 minutes) to fail fast on hanging tests and tighten the development feedback loop. Tests should complete in under 10 minutes or be considered failed.

### Standard Expo Module Refactor (July 31, 2025)

**MAJOR CHANGE**: Refactored from custom module registration to standard Expo module
- ✅ Created `ExpoTermuxModule.kt` following exact Expo conventions
- ✅ Removed `expo-module.config.json` (using modern autolinking)
- ✅ Updated JavaScript to use `NativeModulesProxy.ExpoTermux`
- ✅ Standard package structure: `expo.modules.expotermux`
- 🔄 **Testing in progress** - Should work like expo-camera now

### Current Build Status

**Recent builds succeeding but runtime crashes:**
- APK compilation: ✅ Successful
- Native module compilation: ✅ Successful  
- App installation: ✅ Successful
- App launch: ❌ **IMMEDIATE CRASH**

**Last known working build:** Build 129+ (July 20, 2025) - contained functional Termux integration

### Potential Root Causes for Current Crash

1. **Native Module Initialization** - Termux native modules failing to initialize
2. **Expo Module Configuration** - expo-termux module not properly configured
3. **Dependency Version Conflicts** - React Native/Expo version incompatibilities
4. **Build Configuration Issues** - Gradle/Kotlin compilation problems
5. **Auto-linking Problems** - Expo auto-linking not finding native modules

### Build Commands

```bash
# Local bundle test
npx expo export --platform android --output-dir dist-android

# Check build status
gh run list --workflow="Build and Release APKs" --limit 1

# Manual APK validation trigger
gh workflow run "APK Validation Testing"
```

### Termux Integration Architecture

**Native Layer:**
- `modules/termux-core/` - Native Android implementation
- `modules/termux-core/android/` - Gradle build configuration
- `modules/termux-core/src/` - TypeScript/React Native bridge

**Package Layer:**
- `packages/expo-termux/` - Main npm package
- `packages/demo-app/` - Demo application using expo-termux

**Demo App Features:**
- Terminal tab with xterm.js integration
- Editor tab with code editing capabilities
- Preview tab with WebView for live preview
- Termux Demo tab showcasing native Termux features

### File Structure Notes

- **Termux Integration**: `packages/expo-termux/src/`
- **Demo App Main**: `packages/demo-app/App.tsx`  
- **Native Termux**: `modules/termux-core/android/`
- **APK Validation**: `.github/workflows/apk-validation.yml`

## Expo Compatibility Priority

**CRITICAL: Full Expo compatibility is essential for this Termux integration**

- ✅ **Drop-in compatibility**: Should work in any fresh Expo project without major configuration changes
- ✅ **Minimal setup required**: Users should be able to add the expo-termux module with minimal friction
- ✅ **Standard Expo workflows**: Must work with standard `expo build`, `eas build`, etc.
- ✅ **No breaking changes**: Should not interfere with existing Expo modules or configurations

### Current Priority Order:
1. **Get working build validated** (immediate priority)
2. **Verify Termux functionality works end-to-end** 
3. **Refactor for drop-in Expo compatibility** (post-validation)
4. **Publish expo-termux npm package**

### Drop-in Expo Compatibility Analysis

**Required Configuration Changes for Target Users:**

1. **app.json plugins** (REQUIRED):
   ```json
   {
     "expo": {
       "plugins": ["expo-termux"]
     }
   }
   ```

2. **Dependencies** (REQUIRED):
   ```json
   {
     "dependencies": {
       "expo-termux": "^1.0.0",
       "react-native-webview": "^13.15.0"
     }
   }
   ```

**Optimization Strategy for Drop-in Compatibility:**
- **Package as expo-termux**: Standalone npm package with auto-configuration
- **Plugin approach**: Expo plugin automatically applies needed native configurations
- **Minimal user config**: Only require plugin addition to app.json
- **Auto-dependency management**: Plugin handles WebView and other dependencies

### Post-Validation Compatibility Tasks:
- Extract Termux integration into publishable `expo-termux` npm package
- Create Expo plugin that auto-applies native configurations
- Minimize required user configuration to plugin addition only
- Test integration with various Expo SDK versions (50, 51, 52, 53)
- Document 2-step installation process for fresh projects

## Optimized Development Workflow

### 🚀 FAST ITERATION CYCLE FOR EXPO-TERMUX DEVELOPMENT

**Goal: Reduce development feedback loop from 20+ minutes to 5-10 minutes**

#### 3-Tier Testing Strategy

**🟢 TIER 1: Quick Validation (2-3 minutes)**
```bash
gh workflow run "Quick Validation Pipeline"
```
- TypeScript compilation check
- Bundle creation validation  
- Native module compilation check
- App configuration validation
- Dependency analysis
- **Use for**: Code changes, config updates, quick verification

**🟡 TIER 2: Debug Build (7-10 minutes)**  
```bash
gh workflow run "Debug APK Build with Enhanced Logging"
```
- Full APK build with debug info
- Enhanced crash logging enabled
- Source maps included
- Automatic APK validation trigger
- **Use for**: Runtime issues, crash debugging, feature testing

**🔴 TIER 3: Full Production Test (15-20 minutes)**
```bash
gh workflow run "Build and Release APKs"
# Then: gh workflow run "APK Validation Testing"
```
- Production APK builds (debug + release)
- Complete emulator testing suite
- All 12 test screenshots
- **Use for**: Final validation, release preparation

#### Smart Development Flow

```
1. Code Change → Quick Validation (3min)
   ├─ ✅ Pass → Continue coding
   └─ ❌ Fail → Fix compilation/config issues
   
2. Feature Complete → Debug Build (10min)
   ├─ ✅ Pass → Test more features  
   └─ ❌ Fail → Debug with enhanced logs
   
3. Ready for Testing → Full Production Test (20min)
   ├─ ✅ Pass → Feature complete!
   └─ ❌ Fail → Back to debug build
```

### 🔧 Enhanced Debugging Capabilities

#### Crash Logger Integration
- **Automatic crash detection** in demo app
- **Persistent logging** survives app crashes
- **Module loading tracking** identifies initialization failures
- **Navigation state monitoring** pinpoints crash points

#### Debug Build Features
- **Verbose native logging** with `--info --stacktrace --debug`
- **Source maps included** for stack trace analysis
- **Enhanced logcat capture** including CRASH_LOG tags
- **Pre/post build analysis** with detailed environment info

#### Critical Log Analysis Points
```bash
# Download debug artifacts
gh run download [RUN_ID] --name debug-apk-[SHA]

# Check crash logs
grep "CRASH_LOG" full-launch-log.txt
grep "ReactNativeJS" full-launch-log.txt  
grep "AndroidRuntime" complete-logcat.txt

# Analyze app initialization
grep "App starting up" full-launch-log.txt
grep "Module failed" full-launch-log.txt
```

### 📱 Testing Commands (Optimized)

#### Quick Development Loop
```bash
# 1. Quick check before committing
git add . && git commit -m "Feature: description"
gh workflow run "Quick Validation Pipeline"

# 2. Check validation (30 seconds later)
gh run list --workflow="Quick Validation Pipeline" --limit 1

# 3. If validation passes, push and test
git push
gh workflow run "Debug APK Build with Enhanced Logging"

# 4. Monitor debug build (check every 2-3 minutes)
gh run list --workflow="Debug APK Build" --limit 1

# 5. Download debug artifacts when complete
RUN_ID=$(gh run list --workflow="Debug APK Build" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run download $RUN_ID --name debug-apk-$(git rev-parse --short HEAD)
```

#### Emergency Debugging
```bash
# When app crashes immediately - get ALL the logs
gh workflow run "Debug APK Build with Enhanced Logging" --verbose_logging=true

# Download comprehensive debug package
gh run download [RUN_ID] --name debug-apk-[SHA]

# Analyze in order of priority:
1. debug-info.txt - Build environment
2. full-launch-log.txt - App startup logs  
3. complete-logcat.txt - System logs
4. build-manifest-debug.json - Build details
```

### 🎯 Development Rules (LOCKED IN - July 31, 2025)

1. **STANDARD EXPO MODULE ONLY** - Never deviate from expo-camera pattern
2. **NO custom module registration** - Only modern Expo autolinking
3. **Use 3-tier testing strategy** - Start with quick validation
4. **Always check Tier 1 before pushing** - Prevent broken commits
5. **Never claim success without emulator testing** - Screenshots are proof
6. **Module name MUST be "ExpoTermux"** - JavaScript uses NativeModulesProxy.ExpoTermux
7. **Package MUST be expo.modules.expotermux** - Standard structure only
8. **UPDATE THIS CLAUDE.MD WITH ALL NEW DISCOVERIES** - Keep workflow current

### 🚨 Common Issue Patterns

#### Immediate Crash (00-clean-state.png only)
1. **Check Quick Validation first** - May catch compilation issues
2. **Run Debug Build** - Get enhanced crash logs
3. **Look for**: Module initialization failures, native binding issues
4. **Pattern**: Usually expo-termux native module problems

#### App Launches but Crashes Later (Multiple screenshots)
1. **Count screenshots** - Identifies crash point
2. **Check navigation logs** - Screen mounting issues
3. **Look for**: React component errors, WebView issues
4. **Pattern**: Usually JavaScript runtime errors

#### Native Module Issues
1. **Check gradle build logs** - Compilation problems
2. **Verify auto-linking** - Module registration issues  
3. **Look for**: Kotlin version conflicts, missing dependencies
4. **Pattern**: Usually termux-core module problems

### 📊 Workflow Performance Metrics

| Workflow | Duration | Use Case | Success Rate |
|----------|----------|----------|--------------|
| Quick Validation | 2-3 min | Code changes, config | ~95% |
| Debug Build | 7-10 min | Runtime debugging | ~80% |
| Full Production | 15-20 min | Final validation | ~70% |

**Target**: 90%+ success rate on Quick Validation, 85%+ on Debug Build

## Systematic Testing Progress

### Test Results Log

**Build 124 (Complex App with Termux)**:
- Screenshots: `00-clean-state.png` only
- Result: ❌ Immediate crash on launch
- Conclusion: Complex Termux integration causing runtime issues

**Build 125 (Minimal App - View + Text only)**:
- Screenshots: `00-clean-state.png` only  
- Result: ❌ Immediate crash on launch
- Conclusion: **FUNDAMENTAL REACT NATIVE RUNTIME ISSUE**

**Build 129+ (Working Version)**:
- ✅ App launches and runs successfully
- ✅ All 12 test screenshots generated
- ✅ Termux integration functional
- **Configuration**: Proper Kotlin versions, fixed Babel issues, stable React Native versions

**Build 200+ (Current - Post Webview Fix)**:
- Screenshots: `00-clean-state.png` only
- Result: ❌ **STILL CRASHING IMMEDIATELY**
- **Issue**: Runtime crash preventing app initialization despite successful builds

### Enhanced Debugging Capabilities

**Enhanced APK Validation Logging (Build 129+)**:
- ✅ **Comprehensive logcat capture**: ReactNative, Metro, Hermes, Android runtime, native crashes
- ✅ **Extended monitoring**: 15-second timeout with progress updates  
- ✅ **System analysis**: Memory info, device properties, package dumps
- ✅ **Native crash detection**: Tombstones, kernel logs, linker errors
- ✅ **Complete debug artifacts**: Will capture ALL crash details when properly uploaded

**Key Log Files Generated**:
- `full-launch-log.txt` - Filtered logs during app launch
- `complete-logcat.txt` - Complete system logs  
- `system-properties.txt` - Device configuration
- `package-dump.txt` - App installation details
- `memory-info.txt` - System memory status
- `kernel-log.txt` - Kernel messages

### Current Status Summary (Updated July 28, 2025)

**WORKFLOW STATUS**: ✅ **3-tier development workflow implemented and working**
- 🟢 Quick Validation (3min): ✅ Operational
- 🟡 Debug Build (10min): ✅ Operational  
- 🔴 Full Production (20min): ✅ Operational

**BUILD STATUS**: ✅ APKs compile successfully  
**INSTALLATION STATUS**: ✅ APKs install on emulator successfully  
**LAUNCH STATUS**: ❌ **App crashes immediately on launch - no process appears**  
**DEBUG STATUS**: ✅ **Enhanced logging and crash capture ready for debugging**

### Development Workflow Notes

**Lock File Management**: When adding dependencies to any workspace package (packages/demo-app, packages/expo-termux), always run `npm install` in that package directory and commit the updated root package-lock.json file to prevent dependency resolution issues.

### Development Scripts (ALWAYS USE THESE INSTEAD OF INLINE COMMANDS)

**🚨 CRITICAL WORKFLOW RULE - NO EXCEPTIONS 🚨**

**NEVER USE COMPLEX INLINE BASH COMMANDS - ALWAYS CREATE SCRIPTS**

- ❌ **FORBIDDEN**: Multi-line bash commands, complex pipes, loops in tool calls
- ✅ **REQUIRED**: All commands must use scripts in `scripts/` directory
- ✅ **REQUIRED**: Each script must have detailed header comment explaining purpose
- ✅ **REQUIRED**: User explicitly requested this pattern to avoid "impossible to auto approve" commands

**CRITICAL: Always use reusable scripts in the `scripts/` directory instead of complex inline bash commands**

```bash
# Check workflow status
./scripts/check-build-status.sh
./scripts/check-build-status.sh "APK Validation Testing"

# Trigger APK validation
./scripts/trigger-apk-test.sh
./scripts/trigger-apk-test.sh --wait  # Wait for completion

# Download test results
./scripts/download-test-results.sh
```

**Script Development Rules:**
1. **Always create reusable scripts** - Never use complex inline commands
2. **Add detailed header comments** - Explain purpose, usage, and behavior
3. **Make scripts executable** - `chmod +x scripts/*.sh`  
4. **Handle errors gracefully** - Use `set -e` and proper error messages
5. **Provide usage examples** - Show common use cases in comments

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
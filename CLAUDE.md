# Claude Code Development Guide

## Project Architecture - CRITICAL UNDERSTANDING

**THIS IS A MONOREPO FOR THE `expo-termux` NPM PACKAGE**

- 📦 **Primary Goal**: Create a publishable `expo-termux` npm package that provides Termux integration for any Expo app
- 🎯 **Demo App**: `packages/demo-app` showcases the expo-termux package functionality
- 🔧 **Native Modules**: `modules/termux-core` contains the native Android implementation
- ⚙️ **Build Process**: Root-level builds create APKs of the demo app using the expo-termux package

### Key Components:
1. **`packages/expo-termux/`** - The main npm package (to be published)
2. **`packages/demo-app/`** - Demo application showcasing expo-termux features
3. **`modules/termux-core/`** - Native Android Termux implementation
4. **Root Level** - Monorepo build configuration and demo app compilation

**TERMUX INTEGRATION IS THE CORE FEATURE - NEVER DISABLE IT**

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

The emulator test runs these steps:
- ✅ **Install APK** → Basic APK integrity
- ✅ **Launch App** → `adb shell am start -n com.keeganmccallum.mobile_dev_studio/.MainActivity`
- ✅ **Check Process** → `adb shell ps | grep mobile_dev_studio`
- ✅ **Screenshots** → Progress through app tabs and functionality
- ✅ **Crash Detection** → Any missing screenshots = crash at that point

### Test Result Interpretation

**Successful run produces these screenshots:**
- `00-clean-state.png` - Emulator before install
- `01-post-install.png` - After APK installation
- `02-app-launched.png` - App successfully started
- `03-app-loaded.png` - App fully loaded
- `04-terminal-tab.png` - Terminal tab active
- `05-preview-tab.png` - Preview tab navigation
- `06-editor-tab.png` - Editor tab navigation  
- `07-termux-test-tab.png` - Termux test tab
- `08-create-session-test.png` - Termux functionality test
- `09-execute-command-test.png` - Command execution test
- `10-final-state.png` - All tests completed
- `11-backgrounded.png` - App backgrounded
- `12-foregrounded.png` - App restored

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

### Current App Issues (Updated July 28, 2025)

- **JavaScript Bundle**: ✅ Builds successfully (no syntax errors)  
- **APK Build**: ✅ **FIXED** - All builds completing successfully
- **App Launch**: ❌ **IMMEDIATE CRASH ON LAUNCH** - App fails to start, process never appears
- **Root Cause**: **ACTIVE ISSUE** - Runtime crash preventing app initialization
- **Webview Dependency**: ✅ **FIXED** - Added react-native-webview to demo app dependencies
- **Webview Plugin**: ✅ **FIXED** - Added react-native-webview plugin to app.json

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

### 🎯 Development Rules (Updated)

1. **Use 3-tier testing strategy** - Start with quick validation
2. **Always check Tier 1 before pushing** - Prevent broken commits
3. **Use debug builds for crash investigation** - Enhanced logging captures more info
4. **Never claim success without emulator testing** - Screenshots are proof
5. **Analyze crash logs systematically** - Check initialization, modules, navigation
6. **UPDATE THIS CLAUDE.MD WITH ALL NEW DISCOVERIES** - Keep workflow current
7. **Commit debug artifacts to git when needed** - Preserve debugging context

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

### Testing Loop Commands (Safe - No rm required)

```bash
# Complete test cycle
git add . && git commit -m "Fix attempt X" && git push
gh workflow run "APK Validation Testing"
sleep 60 && gh run list --workflow="APK Validation Testing" --limit 1

# Safe artifact checking - use unique directory per run
RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 --json databaseId --jq '.[0].databaseId')
mkdir -p test-results/run-$RUN_ID
gh run download $RUN_ID --name apk-validation-debug-artifacts --dir test-results/run-$RUN_ID
ls -la test-results/run-$RUN_ID/  # Check what screenshots exist

# Alternative: Check artifact list without downloading
gh api repos/:owner/:repo/actions/runs/$RUN_ID/artifacts --jq '.artifacts[].name'
```

### Quick Status Check (No Downloads)

```bash
# Just check if run passed/failed
gh run list --workflow="APK Validation Testing" --limit 1
# If status is 'failure' and no debug artifacts = immediate crash
```

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
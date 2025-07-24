# Claude Code Development Guide

## Development Environment Context

**CRITICAL: Claude Code is running on Android phone in Termux environment**

- ❌ **No local emulator access** - Cannot run Android emulators locally
- ❌ **No local build capability** - Must use GitHub Actions for all builds
- ❌ **No direct APK testing** - Cannot install/test APKs locally
- ✅ **GitHub Actions only** - All testing must be done via GitHub Actions workflows
- ✅ **Remote emulator testing** - APK Validation Testing workflow is the only way to test

## Critical Testing Workflow

### NEVER CLAIM SUCCESS WITHOUT ACTUAL TESTING

**The only way to verify fixes work is through the GitHub Actions emulator testing pipeline:**

1. **Build APK**: `gh run list --workflow="Build and Release APKs"`
2. **Test APK**: `gh workflow run "APK Validation Testing"`
3. **Check Results**: `gh run list --workflow="APK Validation Testing" --limit 1`
4. **Download Logs**: `gh run download [RUN_ID] --name apk-validation-debug-screenshots`
5. **Analyze Failure**: Check what screenshots exist vs missing ones

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
gh run download [RUN_ID] --name apk-validation-debug-screenshots

# 4. Check what screenshots exist
ls -la *.png

# 5. If crash logs exist, examine them
find . -name "*crash*" -o -name "*log*"
```

### Current App Issues (Updated July 24, 2025)

- **JavaScript Bundle**: ✅ Builds successfully (no syntax errors)  
- **APK Build**: ❌ **KOTLIN COMPILATION FAILURES** in expo-modules-core
- **App Launch**: 🔄 Cannot test - builds failing
- **Root Cause**: **ACTIVE ISSUE** - Kotlin version conflicts with Expo SDK 52.0.0

### Current Build Status

**All recent builds failing with same error:**
```
Execution failed for task ':expo-modules-core:compileDebugKotlin'
> Compilation error. See log for more details
```

**Last successful builds:** July 20, 2025 (Build 125) - contains working Termux integration

**Troubleshooting approach:**
1. ✅ Removed custom Kotlin version overrides
2. ✅ Let Expo manage Kotlin versions
3. ❌ Still failing - deeper Expo/Kotlin compatibility issue

### Critical Discovery

**Even a minimal React Native app (just View + Text) crashes immediately**. This indicates:

- ❌ Not a component-specific issue
- ❌ Not a navigation or complex feature issue  
- ❌ Not a Termux integration issue
- ✅ **Fundamental React Native engine problem**

### Potential Root Causes

1. **JSC Engine Configuration** - JSC not properly initialized
2. **Metro Bundle Corruption** - Bundle not compatible with runtime
3. **React Native Version Conflicts** - Dependencies incompatible
4. **Native Module Setup** - Something broken in native RN setup
5. **Build Tool Configuration** - Gradle/Android build issues

### Build Commands

```bash
# Local bundle test
npx expo export --platform android --output-dir dist-android

# Check build status
gh run list --workflow="Build and Release APKs" --limit 1

# Manual APK validation trigger
gh workflow run "APK Validation Testing"
```

### React Native Debugging

When app crashes on launch, common causes:
- Missing native modules
- Incorrect native module initialization
- Metro bundler issues
- WebView loading failures
- JavaScript runtime errors in JSC engine

### File Structure Notes

- **Termux Integration**: `src/lib/termux/TermuxManager.ts`
- **Main Terminal**: `src/screens/TerminalScreen.tsx`  
- **WebView Terminal**: `src/lib/termux/TermuxTerminal.tsx`
- **Native Module**: `modules/termux-core/`
- **APK Validation**: `.github/workflows/apk-validation.yml`

## Expo Compatibility Priority

**CRITICAL: Full Expo compatibility is essential for this Termux integration**

- ✅ **Drop-in compatibility**: Should work in any fresh Expo project without major configuration changes
- ✅ **Minimal setup required**: Users should be able to add the Termux module with minimal friction
- ✅ **Standard Expo workflows**: Must work with standard `expo build`, `eas build`, etc.
- ✅ **No breaking changes**: Should not interfere with existing Expo modules or configurations

### Current Priority Order:
1. **Get working build validated** (immediate priority)
2. **Verify Termux functionality works end-to-end** 
3. **Refactor for drop-in Expo compatibility** (post-validation)
4. **Create installation guide for fresh Expo projects**

### Drop-in Expo Compatibility Analysis

**Current Required Configuration Changes:**

1. **android/build.gradle** (MUST MINIMIZE):
   - ✅ **Critical**: Kotlin version enforcement (expo-modules-core compatibility)
   - ❌ **Drop-in barrier**: Force resolution strategies (could be module-specific)
   - ❌ **Drop-in barrier**: SoftwareComponent publishing fixes (could be automated)
   - ✅ **Acceptable**: Java 17 compatibility (standard for modern projects)

2. **gradle.properties** (MOSTLY ACCEPTABLE):
   - ✅ **Standard**: Most properties are Expo/React Native best practices
   - ❌ **Could minimize**: Kotlin version overrides (if we fix expo-modules-core detection)

3. **android/settings.gradle** (CURRENTLY CLEAN):
   - ✅ **Good**: No Termux-specific changes (Termux modules disabled)
   - ✅ **Standard**: Uses expo-autolinking (standard Expo setup)

**Optimization Strategy for Drop-in Compatibility:**
- **Package as expo-termux**: Create standalone npm package with auto-configuration
- **Gradle plugin approach**: Termux plugin automatically applies needed fixes
- **Conditional configuration**: Detect fresh Expo projects and apply minimal changes
- **Version detection**: Auto-detect Kotlin version conflicts and resolve programmatically

### Post-Validation Compatibility Tasks:
- Extract Termux integration into `expo-termux` npm package
- Create gradle plugin that auto-applies Kotlin version fixes
- Minimize required user configuration to near-zero
- Test integration with various Expo SDK versions (50, 51, 52, 53)
- Document 3-step installation process for fresh projects

## Development Rules

1. **Always use emulator testing to verify fixes**
2. **Never claim success without downloading and checking screenshots**
3. **Document all testing steps and findings**
4. **Focus on runtime errors, not just build errors**
5. **Iterate quickly through the test-fix-test cycle**
6. **UPDATE THIS CLAUDE.MD WITH ALL NEW DISCOVERIES IMMEDIATELY**
7. **CRITICAL: ALWAYS READ BUILD LOGS CAREFULLY FOR EXACT ERROR MESSAGES**
   - Look for specific method names, line numbers, and file paths
   - Don't assume the problem based on general error types
   - Search for exact error text: "Could not find method X()"
   - **READ FULL LOGS, NOT JUST GREP** - Multiple different errors can occur simultaneously
   - **Example**: Debug build had `classifier()` method error, Release build had `SoftwareComponent 'release'` property error

## Systematic Testing Progress

### Test Results Log

**Build 124 (Original Complex App)**:
- Screenshots: `00-clean-state.png` only
- Result: ❌ Immediate crash on launch
- Conclusion: Complex components suspected

**Build 125 (Minimal App - View + Text only)**:
- Screenshots: `00-clean-state.png` only  
- Result: ❌ Immediate crash on launch
- Conclusion: **FUNDAMENTAL REACT NATIVE RUNTIME ISSUE**

**Build 126 (Simplified Configs)**:
- Metro: Stripped to bare minimum
- Babel: Only core preset
- Screenshots: `00-clean-state.png` only
- Result: ❌ Still crashing immediately
- Conclusion: Config complexity not the issue

**Build 127 (Hermes Engine)**:
- Switched from JSC to Hermes
- Screenshots: `00-clean-state.png` only
- Result: ❌ Still crashing immediately
- Conclusion: NOT an engine-specific issue

**Build 128 (Stable Version Stack)**:
- React: 19.0.0 → 18.2.0
- React Native: 0.79.5 → 0.75.4  
- Expo: 53.0.20 → 52.0.0
- JSC engine (back from Hermes)
- Screenshots: `00-clean-state.png` only
- Result: ❌ **STILL CRASHING IMMEDIATELY**
- Conclusion: Version compatibility not the root cause

**Build 129+ (Final Fix)**:
- ✅ Fixed Babel loose mode conflicts 
- ✅ Added @babel/plugin-transform-private-methods
- ✅ Upgraded Kotlin version 1.9.24 → 1.9.25 for Compose Compiler compatibility
- ✅ Temporarily disabled Termux modules (modules-disabled/)
- Screenshots: Complete success - all 12 screenshots generated
- Result: ✅ **APP LAUNCHES AND RUNS SUCCESSFULLY**
- Conclusion: **FUNDAMENTAL ISSUES RESOLVED**

### Version Compatibility Issue Discovered

The app was using **bleeding-edge versions** that have compatibility issues:
- React 19.0.0 (very new, December 2024)
- React Native 0.79.5 (latest, potential compatibility issues)
- Expo 53 (newest SDK)

**Hypothesis**: This combination is too new and has runtime incompatibilities causing immediate crashes.

### Enhanced Debugging Capabilities

**Enhanced APK Validation Logging (Build 129+)**:
- ✅ **Comprehensive logcat capture**: ReactNative, Metro, Hermes, Android runtime, native crashes
- ✅ **Extended monitoring**: 15-second timeout with progress updates  
- ✅ **System analysis**: Memory info, device properties, package dumps
- ✅ **Native crash detection**: Tombstones, kernel logs, linker errors
- ✅ **Complete debug artifacts**: Will capture ALL crash details

**Key Log Files Generated**:
- `full-launch-log.txt` - Filtered logs during app launch
- `complete-logcat.txt` - Complete system logs  
- `system-properties.txt` - Device configuration
- `package-dump.txt` - App installation details
- `memory-info.txt` - System memory status
- `kernel-log.txt` - Kernel messages

### Iteration Strategy - COMPLETED ✅

All fundamental React Native runtime issues have been resolved:

1. ✅ Simplified Metro/Babel configs
2. ✅ Test JSC engine setup
3. ✅ Check React Native version compatibility  
4. ✅ Enhanced crash logging system implemented
5. ✅ Disabled native CMake build (Termux module) - **CRITICAL FIX**
6. ✅ Fixed Gradle/Android build configuration - **Kotlin version upgrade**
7. ✅ **APP NOW LAUNCHES SUCCESSFULLY**

### Next Phase: Termux Integration

Now that basic React Native functionality works, re-enable Termux modules incrementally.

### Termux Module Integration Fixes

**Critical Gradle API Issues Fixed:**

1. **Deprecated `classifier` API** - Fixed in 2 files:
   - `modules/termux-core/terminal-emulator/build.gradle:59`
   - `modules/termux-core/terminal-view/build.gradle:37`
   - **Fix**: Changed `classifier "sources"` → `archiveClassifier = "sources"`
   - **Root Cause**: Modern Gradle versions deprecated the `classifier` method

2. **Kotlin Version Resolution** - Added force resolution in `android/build.gradle`:
   ```gradle
   configurations.all {
     resolutionStrategy {
       force "org.jetbrains.kotlin:kotlin-stdlib:1.9.25"
       force "org.jetbrains.kotlin:kotlin-stdlib-common:1.9.25" 
       force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.25"
       force "org.jetbrains.kotlin:kotlin-reflect:1.9.25"
     }
   }
   ```

**Testing Progress:**
- ✅ Basic React Native app launches successfully (without Termux)
- ✅ Termux modules re-enabled with Gradle fixes applied
- ✅ TypeScript compilation errors fixed with custom type declarations
- 🔄 **IN PROGRESS**: Fixing SoftwareComponent 'release' errors in Termux module build.gradle files
- **Current Issues**: Expo SoftwareComponent errors still occurring in terminal-emulator and terminal-view modules

### Development Workflow Notes

**Task Tool Limitation**: The Task tool for spawning sub-agents doesn't work reliably in this environment. All work must be done at the top level with manual build monitoring.

### Testing Loop Commands (Safe - No rm required)

```bash
# Complete test cycle
git add . && git commit -m "Fix attempt X" && git push
gh workflow run "APK Validation Testing"
sleep 60 && gh run list --workflow="APK Validation Testing" --limit 1

# Safe artifact checking - use unique directory per run
RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 --json databaseId --jq '.[0].databaseId')
mkdir -p test-results/run-$RUN_ID
gh run download $RUN_ID --name apk-validation-debug-screenshots --dir test-results/run-$RUN_ID
ls -la test-results/run-$RUN_ID/  # Check what screenshots exist

# Alternative: Check artifact list without downloading
gh api repos/:owner/:repo/actions/runs/$RUN_ID/artifacts --jq '.artifacts[].name'
```

### Quick Status Check (No Downloads)

```bash
# Just check if run passed/failed
gh run list --workflow="APK Validation Testing" --limit 1
# If status is 'failure' and no other screenshots mentioned = immediate crash
```
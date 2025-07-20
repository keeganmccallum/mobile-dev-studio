# Claude Code Development Guide

## Critical Testing Workflow

### NEVER CLAIM SUCCESS WITHOUT ACTUAL TESTING

**The only way to verify fixes work is through the emulator testing pipeline:**

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

### Current App Issues

- **JavaScript Bundle**: ✅ Builds successfully (no syntax errors)  
- **APK Build**: ✅ Compiles successfully (121MB release APK)
- **App Launch**: ❌ Crashes immediately on startup
- **Root Cause**: **FUNDAMENTAL REACT NATIVE RUNTIME ISSUE**

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

## Development Rules

1. **Always use emulator testing to verify fixes**
2. **Never claim success without downloading and checking screenshots**
3. **Document all testing steps and findings**
4. **Focus on runtime errors, not just build errors**
5. **Iterate quickly through the test-fix-test cycle**
6. **UPDATE THIS CLAUDE.MD WITH ALL NEW DISCOVERIES IMMEDIATELY**

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

### Iteration Strategy

Since minimal RN apps crash, we must fix the runtime foundation:

1. ✅ Simplified Metro/Babel configs
2. 🔄 Test JSC engine setup
3. 🔄 Check React Native version compatibility  
4. 🔄 Investigate Gradle/Android build configuration
5. 🔄 Test with different JS engines (if JSC fails)

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
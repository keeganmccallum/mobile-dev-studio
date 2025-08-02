#!/bin/bash

# APK Validation Test Script
# This script runs inside the Android emulator to validate APK functionality

set -e

# Set overall script timeout to 8 minutes (480 seconds) 
# This ensures the script will terminate before the 10-minute job timeout
timeout 480 bash -c '

# Trap to ensure we clean exit on timeout
trap "echo \"❌ Script timed out after 8 minutes\"; exit 124" EXIT

echo "🔍 Testing $BUILD_TYPE APK: $APK_PATH"
echo "🔍 APK_PATH variable: [$APK_PATH]"
echo "🔍 File exists check: $([ -f "$APK_PATH" ] && echo "YES" || echo "NO")"

# Validate APK path exists
if [ -z "$APK_PATH" ]; then
  echo "❌ APK_PATH is empty!"
  find . -name "*.apk" -type f
  exit 1
fi

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK file not found: $APK_PATH"
  exit 1
fi

# Wait for emulator to be ready with timeout
echo "⏳ Waiting for emulator to boot completely..."
timeout 30 adb wait-for-device || {
  echo "❌ Timeout waiting for device"
  exit 1
}

# Wait for system to be ready with shorter timeout
timeout 60 bash -c 'while [[ -z $(adb shell getprop sys.boot_completed 2>/dev/null | tr -d "\r") ]]; do 
  echo "Still booting..."
  sleep 2
done' || {
  echo "❌ Timeout waiting for boot completion"
  exit 1
}

echo "⏳ Ensuring emulator stability..."
sleep 5  # Reduced from 10 to 5 seconds

# Unlock screen
adb shell input keyevent 82 || true
adb shell input keyevent 26 || true
adb shell input swipe 540 1200 540 600 || true

echo "✅ Emulator ready for testing"

# Clear any existing installs
echo "🧹 Clearing previous installations..."
adb uninstall com.keeganmccallum.mobile_dev_studio || true

# Create screenshots and debug directories early
mkdir -p screenshots/$BUILD_TYPE
echo "Debug artifacts directory created: screenshots/$BUILD_TYPE" > screenshots/$BUILD_TYPE/workflow-status.log

# Take screenshot of clean state
adb exec-out screencap -p > screenshots/$BUILD_TYPE/00-clean-state.png

# Install the APK with comprehensive debugging
echo "📱 Installing $BUILD_TYPE APK..."

# Create debug log file
DEBUG_LOG="screenshots/$BUILD_TYPE/installation-debug.log"
echo "=== APK Installation Debug Log - $(date) ===" > "$DEBUG_LOG"
echo "APK Path: $APK_PATH" >> "$DEBUG_LOG"
echo "APK Info:" >> "$DEBUG_LOG"
ls -la "$APK_PATH" >> "$DEBUG_LOG" 2>&1
file "$APK_PATH" >> "$DEBUG_LOG" 2>&1
echo "" >> "$DEBUG_LOG"

echo "=== Device Info ===" >> "$DEBUG_LOG"
adb shell getprop ro.build.version.sdk >> "$DEBUG_LOG" 2>&1
adb shell getprop ro.product.cpu.abi >> "$DEBUG_LOG" 2>&1
adb shell getprop ro.build.version.release >> "$DEBUG_LOG" 2>&1
echo "" >> "$DEBUG_LOG"

# Try multiple installation methods
INSTALL_SUCCESS=false

echo "=== Installation Attempt 1: adb install -r -t -d ===" >> "$DEBUG_LOG"
if adb install -r -t -d "$APK_PATH" >> "$DEBUG_LOG" 2>&1; then
  echo "✅ Installation successful with method 1"
  INSTALL_SUCCESS=true
else
  echo "❌ Method 1 failed, trying method 2..."
  echo "" >> "$DEBUG_LOG"
  echo "=== Installation Attempt 2: adb install -r -t -d -g ===" >> "$DEBUG_LOG"
  if adb install -r -t -d -g "$APK_PATH" >> "$DEBUG_LOG" 2>&1; then
    echo "✅ Installation successful with method 2"
    INSTALL_SUCCESS=true
  else
    echo "❌ Method 2 failed, trying method 3..."
    echo "" >> "$DEBUG_LOG"
    echo "=== Installation Attempt 3: adb install ===" >> "$DEBUG_LOG"
    if adb install "$APK_PATH" >> "$DEBUG_LOG" 2>&1; then
      echo "✅ Installation successful with method 3"
      INSTALL_SUCCESS=true
    else
      echo "❌ All installation methods failed"
      INSTALL_SUCCESS=false
    fi
  fi
fi

echo "" >> "$DEBUG_LOG"
echo "=== Package Manager Logs ===" >> "$DEBUG_LOG"
adb logcat -d -s PackageManager:*,PackageInstaller:* >> "$DEBUG_LOG" 2>&1

if [ "$INSTALL_SUCCESS" != "true" ]; then
  echo "📋 Installation failed - debug info saved to $DEBUG_LOG"
  cat "$DEBUG_LOG"
  exit 1
fi

# Verify installation (with retry for timing issues)
echo "🔍 Verifying installation..."
VERIFICATION_SUCCESS=false
INSTALLED_PACKAGE=""

# Wait a bit for package manager to update
sleep 3

for i in {1..8}; do
  echo "  Verification attempt $i/8..."
  
  # Try multiple package name patterns that might be used
  PACKAGE_PATTERNS=(
    "com.keeganmccallum.mobile_dev_studio"
    "com.keeganmccallum.mobile-dev-studio" 
    "com.keeganmccallum.mobiledevstudio"
    "com.keeganmccallum.termux_demo_app"
    "keeganmccallum.mobile"
    "mobile.dev.studio"
    "mobile_dev_studio"
  )
  
  for pattern in "${PACKAGE_PATTERNS[@]}"; do
    if adb shell pm list packages | grep -q "$pattern"; then
      echo "✅ Package verification successful via pm list packages: $pattern (attempt $i/8)"
      INSTALLED_PACKAGE="$pattern"
      VERIFICATION_SUCCESS=true
      break 2
    fi
    
    if adb shell pm path "$pattern" 2>/dev/null | grep -q "package:"; then
      echo "✅ Package verification successful via pm path: $pattern (attempt $i/8)"
      INSTALLED_PACKAGE="$pattern"
      VERIFICATION_SUCCESS=true
      break 2
    fi
  done
  
  # Also try finding any package containing our app name parts
  FOUND_PACKAGE_LINE=$(adb shell pm list packages | grep -E "(mobile|studio|keeganmccallum)" | head -1)
  if [ -n "$FOUND_PACKAGE_LINE" ]; then
    # Extract package name from "package:com.example.app" format
    INSTALLED_PACKAGE=$(echo "$FOUND_PACKAGE_LINE" | sed 's/package://')
    echo "✅ Package verification successful via pattern match: $FOUND_PACKAGE_LINE (attempt $i/8)"
    VERIFICATION_SUCCESS=true
    break
  fi
  
  if [ $i -lt 8 ]; then
    echo "    Package not yet visible, waiting 3 seconds..."
    sleep 3
  fi
done

if [ "$VERIFICATION_SUCCESS" != "true" ]; then
  echo "❌ APK installation failed verification after 8 attempts (27 seconds)"
  echo ""
  echo "🔍 Comprehensive debug information:"
  echo "All installed packages:"
  adb shell pm list packages | sort
  echo ""
  echo "Recent package manager activity:"
  adb logcat -d -s PackageManager:* | tail -20
  exit 1
fi

echo "✅ APK installed successfully"
echo "📋 Detected package name: $INSTALLED_PACKAGE"

# Take screenshot after installation
adb exec-out screencap -p > screenshots/$BUILD_TYPE/01-post-install.png

# Launch the app using the detected package name
echo "🚀 Launching app..."
echo "📋 Using package: $INSTALLED_PACKAGE"

# Try multiple activity name patterns
MAIN_ACTIVITIES=(
  ".MainActivity"
  ".MainActivity"
  "com.keeganmccallum.mobile_dev_studio.MainActivity"
  "${INSTALLED_PACKAGE}.MainActivity"  
)

LAUNCH_SUCCESS=false
for activity in "${MAIN_ACTIVITIES[@]}"; do
  echo "  Trying to launch: $INSTALLED_PACKAGE/$activity"
  if adb shell am start -n "$INSTALLED_PACKAGE/$activity" 2>/dev/null; then
    echo "✅ Launch command executed successfully"
    LAUNCH_SUCCESS=true
    break
  fi
done

if [ "$LAUNCH_SUCCESS" != "true" ]; then
  echo "❌ All launch attempts failed"
  adb exec-out screencap -p > screenshots/$BUILD_TYPE/02-launch-failed.png
  exit 1
fi

# Wait and check if app launched
sleep 5
APP_PID=$(adb shell ps | grep "$INSTALLED_PACKAGE" | awk '{print $2}' || echo "")

if [ -z "$APP_PID" ]; then
  echo "❌ App failed to launch"
  adb exec-out screencap -p > screenshots/$BUILD_TYPE/02-launch-failed.png
  exit 1
fi

echo "✅ App launched successfully (PID: $APP_PID)"
adb exec-out screencap -p > screenshots/$BUILD_TYPE/02-app-launched.png

# Wait for app to fully load
sleep 10
adb exec-out screencap -p > screenshots/$BUILD_TYPE/03-app-loaded.png

# Navigate to Termux Features tab and test functionality
echo "🧪 Testing Termux functionality..."

# Navigate to Termux Features tab (4th tab)
echo "📱 Navigating to Termux Features tab..."
adb shell input tap 602 1510  # Tap on "Termux Features" tab
sleep 3
adb exec-out screencap -p > screenshots/$BUILD_TYPE/04-termux-tab.png

# Try to create a Termux session
echo "🔧 Testing Termux session creation..."
adb shell input tap 351 452  # Tap "Create New Session" button
sleep 5
adb exec-out screencap -p > screenshots/$BUILD_TYPE/05-create-session-test.png

# Check for multiple types of errors indicating native module failure
echo "🔍 Checking for Termux native module errors..."

# Method 1: Check logcat for React Native JavaScript errors
REACT_ERROR=$(adb logcat -d -s ReactNativeJS:E | grep -i "termux\|native.*module" | tail -5 || echo "")

# Method 2: Check logcat for native crashes
NATIVE_ERROR=$(adb logcat -d -s AndroidRuntime:E | grep -i "termux" | tail -3 || echo "")

# Method 3: Look for UI text indicating error (using UI automator dump)
echo "📋 Checking UI for error dialog..."
adb shell uiautomator dump /data/local/tmp/ui.xml 2>/dev/null || echo "UI dump failed"
UI_ERROR=$(adb shell cat /data/local/tmp/ui.xml 2>/dev/null | grep -i "error.*termux\|failed.*create.*session\|native.*module.*not.*available" || echo "")

# Method 4: Check window manager for error dialogs 
WINDOW_ERROR=$(adb shell dumpsys window windows | grep -i "error\|alert" || echo "")

if [ -n "$REACT_ERROR" ] || [ -n "$NATIVE_ERROR" ] || [ -n "$UI_ERROR" ] || [ -n "$WINDOW_ERROR" ]; then
  echo "❌ Termux native module error detected"
  adb exec-out screencap -p > screenshots/$BUILD_TYPE/06-termux-error.png
  
  # Capture comprehensive error details
  echo "=== Error Detection Report ===" > screenshots/$BUILD_TYPE/termux-error.log
  echo "Timestamp: $(date)" >> screenshots/$BUILD_TYPE/termux-error.log
  echo "" >> screenshots/$BUILD_TYPE/termux-error.log
  
  if [ -n "$REACT_ERROR" ]; then
    echo "React Native JavaScript Errors:" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "$REACT_ERROR" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "" >> screenshots/$BUILD_TYPE/termux-error.log
  fi
  
  if [ -n "$NATIVE_ERROR" ]; then
    echo "Native Runtime Errors:" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "$NATIVE_ERROR" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "" >> screenshots/$BUILD_TYPE/termux-error.log
  fi
  
  if [ -n "$UI_ERROR" ]; then
    echo "UI Error Dialog Detected:" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "$UI_ERROR" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "" >> screenshots/$BUILD_TYPE/termux-error.log
  fi
  
  if [ -n "$WINDOW_ERROR" ]; then
    echo "Window Manager Errors:" >> screenshots/$BUILD_TYPE/termux-error.log
    echo "$WINDOW_ERROR" >> screenshots/$BUILD_TYPE/termux-error.log
  fi
  
  echo "❌ TERMUX FUNCTIONALITY FAILED - Native module not working"
  echo "✅ APK installation: Success"
  echo "✅ App launch: Success"  
  echo "❌ Termux integration: FAILED"
  exit 1
fi

echo "✅ No immediate errors detected, continuing validation..."

# Test if session was created successfully by checking UI
sleep 3
echo "🔍 Verifying Termux session creation..."
adb exec-out screencap -p > screenshots/$BUILD_TYPE/06-session-created.png

# Check if "Active Sessions: 0" text changed to indicate session creation
echo "📋 Checking session count in UI..."
adb shell uiautomator dump /data/local/tmp/ui_after.xml 2>/dev/null || echo "UI dump failed"
SESSION_COUNT=$(adb shell cat /data/local/tmp/ui_after.xml 2>/dev/null | grep -o "Active Sessions: [0-9]*" || echo "Active Sessions: 0")
echo "Current session count: $SESSION_COUNT"

if echo "$SESSION_COUNT" | grep -q "Active Sessions: 0"; then
  echo "❌ No Termux sessions were created - native module likely failed"
  adb exec-out screencap -p > screenshots/$BUILD_TYPE/07-session-failed.png
  
  # Double check for error dialogs that might have appeared later
  LATE_UI_ERROR=$(adb shell cat /data/local/tmp/ui_after.xml 2>/dev/null | grep -i "error\|failed\|not.*available" || echo "")
  if [ -n "$LATE_UI_ERROR" ]; then
    echo "Late error detected: $LATE_UI_ERROR" >> screenshots/$BUILD_TYPE/termux-error.log
  fi
  
  echo "❌ TERMUX FUNCTIONALITY FAILED - Sessions not created"
  echo "✅ APK installation: Success"
  echo "✅ App launch: Success"  
  echo "❌ Termux integration: FAILED"
  exit 1
fi

# Try creating another session to test functionality
echo "📊 Testing additional session creation..."
adb shell input tap 351 452  # Try another session creation
sleep 3
adb exec-out screencap -p > screenshots/$BUILD_TYPE/07-session-validation.png

echo "🎉 APK validation completed successfully!"
echo "✅ APK installation: Success"
echo "✅ App launch: Success"
echo "✅ Termux integration: Success"
echo "✅ Native module: Working"

# Remove timeout trap and exit normally
trap - EXIT

' # End of timeout wrapper
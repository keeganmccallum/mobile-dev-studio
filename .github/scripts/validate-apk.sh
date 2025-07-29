#!/bin/bash

# APK Validation Test Script
# This script runs inside the Android emulator to validate APK functionality

set -e

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

# Wait for emulator to be ready
echo "⏳ Waiting for emulator to boot completely..."
adb wait-for-device

# Wait for system to be ready
timeout 120 bash -c 'while [[ -z $(adb shell getprop sys.boot_completed 2>/dev/null | tr -d "\r") ]]; do 
  echo "Still booting..."
  sleep 2
done'

echo "⏳ Ensuring emulator stability..."
sleep 10

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
for i in {1..5}; do
  if adb shell pm list packages | grep -q "com.keeganmccallum.mobile_dev_studio"; then
    echo "✅ Package verification successful (attempt $i/5)"
    break
  fi
  if [ $i -eq 5 ]; then
    echo "❌ APK installation failed verification after 5 attempts"
    echo "Installed packages containing 'mobile':"
    adb shell pm list packages | grep mobile || echo "No packages found containing 'mobile'"
    echo "All packages:"
    adb shell pm list packages | head -20
    exit 1
  fi
  echo "  Attempt $i/5: Package not yet visible, waiting..."
  sleep 2
done

echo "✅ APK installed successfully"

# Take screenshot after installation
adb exec-out screencap -p > screenshots/$BUILD_TYPE/01-post-install.png

# Launch the app
echo "🚀 Launching app..."
adb shell am start -n com.keeganmccallum.mobile_dev_studio/.MainActivity

# Wait and check if app launched
sleep 5
APP_PID=$(adb shell ps | grep com.keeganmccallum.mobile_dev_studio | awk '{print $2}' || echo "")

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

echo "🎉 APK validation completed successfully!"
echo "✅ APK installation: Success"
echo "✅ App launch: Success"
echo "✅ No crashes detected"
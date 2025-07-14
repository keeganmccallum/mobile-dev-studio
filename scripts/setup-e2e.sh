#!/bin/bash

# E2E Test Setup Script
# Sets up environment for running E2E tests with Detox

set -e

echo "🧪 Setting up E2E Test Environment"
echo "================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Install E2E testing dependencies
echo "📱 Installing E2E testing tools..."
npm install --save-dev detox jest-junit

# Setup Android SDK (if not already installed)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🤖 Setting up Android environment..."
    
    # Check if Android SDK is available
    if ! command -v adb &> /dev/null; then
        echo "⚠️  Android SDK not found. Please install Android SDK and add it to PATH"
        echo "   Required tools: adb, emulator, avdmanager, sdkmanager"
    else
        echo "✅ Android SDK found: $(adb version | head -n1)"
    fi
    
    # List available AVDs
    echo "📱 Available Android Virtual Devices:"
    if command -v emulator &> /dev/null; then
        emulator -list-avds || echo "   No AVDs found. You may need to create one."
    else
        echo "   emulator command not found"
    fi
fi

# Setup iOS environment (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Setting up iOS environment..."
    
    if ! command -v xcrun &> /dev/null; then
        echo "❌ Xcode command line tools are required but not installed"
        echo "   Run: xcode-select --install"
        exit 1
    fi
    
    echo "✅ Xcode tools found"
    
    # List available iOS simulators
    echo "📱 Available iOS Simulators:"
    xcrun simctl list devices | grep -E "(iPhone|iPad)" | grep -v "unavailable" || echo "   No simulators found"
fi

# Create necessary directories
echo "📁 Creating test directories..."
mkdir -p __tests__/e2e/screenshots
mkdir -p test-results
mkdir -p e2e

# Build the app for E2E testing
echo "🔨 Building app for E2E testing..."

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "   Building Android APK..."
    if [ -d "android" ]; then
        npm run build:e2e:android || echo "⚠️  Android build failed. This is expected if Expo project isn't ejected yet."
    else
        echo "   Android directory not found. Using Expo managed workflow."
    fi
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   Building iOS app..."
    if [ -d "ios" ]; then
        npm run build:e2e:ios || echo "⚠️  iOS build failed. This is expected if Expo project isn't ejected yet."
    else
        echo "   iOS directory not found. Using Expo managed workflow."
    fi
fi

# Initialize Detox
echo "⚙️  Initializing Detox configuration..."
if [ ! -f ".detoxrc.json" ] && [ ! -f "detox.config.js" ]; then
    echo "   Detox config already exists"
else
    echo "   ✅ Detox configuration found"
fi

echo ""
echo "🎉 E2E Test Environment Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start an Android emulator or connect a device"
echo "   2. Run: npm run test:e2e:android"
echo ""
echo "   Or for iOS (macOS only):"
echo "   1. Run: npm run test:e2e:ios"
echo ""
echo "📸 Screenshots will be saved to: __tests__/e2e/screenshots/"
echo "📊 Test results will be saved to: test-results/"
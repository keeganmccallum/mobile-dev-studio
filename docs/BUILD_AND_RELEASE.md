# 🏗️ Build and Release Guide

This guide explains how to build and release Mobile Dev Studio APKs using GitHub Actions.

## 🚀 Quick Start

### Automatic Builds

The project is configured for automatic building and releasing:

- **Push to main**: Creates beta releases
- **Tags (v*)**: Creates stable releases  
- **Manual trigger**: Choose release type (beta/stable/nightly)
- **Nightly**: Automatic builds every day at 2 AM UTC

### Manual Release

1. Go to [GitHub Actions](../../actions)
2. Select "Build and Release APKs" workflow
3. Click "Run workflow"
4. Choose release type and trigger

## 📱 APK Variants

Each build creates two APK variants:

### Debug APK
- **Purpose**: Development and testing
- **Features**: Debug symbols, logging enabled
- **Size**: Larger (~50-80MB)
- **Signing**: Debug keystore
- **Use for**: Testing new features, debugging issues

### Release APK  
- **Purpose**: Production distribution
- **Features**: Optimized, minified, obfuscated
- **Size**: Smaller (~30-50MB)
- **Signing**: Release keystore (required)
- **Use for**: App store distribution, user downloads

## 🔑 Signing Setup

Release APKs require proper signing. Follow these steps:

### 1. Generate Keystore

```bash
# Run the signing setup script
./scripts/setup-signing.sh
```

This will:
- Create a release keystore
- Generate passwords
- Provide GitHub secrets values
- Update .gitignore

### 2. Add GitHub Secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore file | `MIIEvgIBADANBgkqhkiG9w0...` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | `your-keystore-password` |
| `ANDROID_KEY_ALIAS` | Key alias | `mobile-dev-studio` |
| `ANDROID_KEY_PASSWORD` | Key password | `your-key-password` |

### 3. Verify Signing

After adding secrets, the next release build will create signed APKs.

## 📋 Build Process

### GitHub Actions Workflow

The build process includes:

1. **Environment Setup**
   - Node.js 20
   - Java 17
   - Android SDK
   - Expo CLI

2. **Code Preparation**
   - Install dependencies
   - Run tests (unit, integration, E2E)
   - Lint and type check

3. **APK Building**
   - Expo prebuild (creates Android project)
   - Gradle build (debug + release)
   - APK signing (release only)

4. **Release Creation**
   - Upload artifacts
   - Create GitHub release
   - Generate release notes
   - Post PR comments (if applicable)

### Build Artifacts

Each build generates:

- **APK files**: Ready-to-install Android packages
- **Build manifests**: JSON files with build metadata
- **Release notes**: Automatically generated documentation
- **Test results**: Unit, integration, and E2E test reports
- **Screenshots**: E2E test visual documentation

## 📦 Download Options

### GitHub Releases

1. Go to [Releases](../../releases)
2. Find your desired version
3. Download APK from **Assets** section

### GitHub Actions Artifacts

1. Go to [Actions](../../actions)
2. Click on a workflow run
3. Download from **Artifacts** section
4. Note: Artifacts expire after 90 days

### Direct Links

Each release includes direct download links in the release notes.

## 🏷️ Release Types

### Stable Releases
- **Trigger**: Git tags (`v1.0.0`, `v1.2.3`)
- **Naming**: `mobile-dev-studio-stable-release-{build}-{commit}.apk`
- **Purpose**: Production-ready versions
- **Testing**: Full test suite required

### Beta Releases  
- **Trigger**: Push to main branch
- **Naming**: `mobile-dev-studio-beta-release-{build}-{commit}.apk`
- **Purpose**: Pre-release testing
- **Testing**: Automated tests + manual verification

### Nightly Builds
- **Trigger**: Daily at 2 AM UTC
- **Naming**: `mobile-dev-studio-nightly-release-{build}-{commit}.apk`
- **Purpose**: Latest development changes
- **Testing**: Basic automated tests

### Development Builds
- **Trigger**: Feature branches, PRs
- **Naming**: `mobile-dev-studio-dev-debug-{build}-{commit}.apk`
- **Purpose**: Feature testing
- **Testing**: Unit tests only

## 🛠️ Local Building

### Prerequisites

```bash
# Install dependencies
npm ci
cd modules/termux-core && npm ci && cd ../..

# Install Expo CLI
npm install -g @expo/cli
```

### Debug Build

```bash
# Generate Android project
npx expo prebuild --platform android --clear

# Build debug APK
cd android && ./gradlew assembleDebug
```

### Release Build (Local)

```bash
# Set up signing (if not done)
./scripts/setup-signing.sh

# Build release APK  
cd android && ./gradlew assembleRelease
```

APKs will be in `android/app/build/outputs/apk/`

## 🧪 Testing Builds

### Installation

1. Enable "Unknown sources" in Android settings
2. Download APK file
3. Install via file manager or ADB:
   ```bash
   adb install path/to/your-app.apk
   ```

### Verification

- App launches successfully
- All tabs (Terminal, Preview, Files) work
- Terminal shows Alpine Linux environment
- No crashes during normal usage

## 🔍 Troubleshooting

### Build Failures

**Gradle build fails:**
- Check Java version (requires JDK 17)
- Verify Android SDK installation
- Clear gradle cache: `cd android && ./gradlew clean`

**Signing fails:**
- Verify GitHub secrets are set correctly
- Check keystore password requirements
- Ensure keystore file is valid

**E2E tests fail:**
- Android emulator issues (common in CI)
- Screenshot capture problems
- Network connectivity in CI

### APK Issues

**App won't install:**
- Check Android version compatibility (minimum API 21)
- Verify APK isn't corrupted
- Clear previous installations

**App crashes on startup:**
- Check device logs: `adb logcat`
- Verify permissions are granted
- Check available storage space

## 📊 Build Statistics

Recent build metrics:
- **Build time**: ~15-25 minutes
- **APK size**: 30-80MB (depending on variant)
- **Success rate**: >95% on main branch
- **Test coverage**: 80%+ unit tests

## 🔗 Links

- [GitHub Actions Workflows](../../actions)
- [Latest Releases](../../releases)
- [Issue Tracker](../../issues)
- [Development Guide](./DEVELOPMENT.md)
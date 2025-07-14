#!/bin/bash

# Android Signing Setup Script
# Creates a keystore for signing release APKs

set -e

echo "🔑 Android APK Signing Setup"
echo "============================"

KEYSTORE_NAME="release.keystore"
KEY_ALIAS="mobile-dev-studio"

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "❌ keytool not found. Please install Java JDK."
    exit 1
fi

echo "📋 This script will create a keystore for signing release APKs."
echo "⚠️  Keep the keystore and passwords safe - you'll need them to update your app!"
echo ""

# Get keystore information
read -p "Enter keystore password (min 6 characters): " -s KEYSTORE_PASSWORD
echo ""
read -p "Enter key password (min 6 characters): " -s KEY_PASSWORD
echo ""
read -p "Enter your full name: " FULL_NAME
read -p "Enter your organization: " ORGANIZATION
read -p "Enter your city: " CITY
read -p "Enter your state/province: " STATE
read -p "Enter your country code (e.g., US): " COUNTRY

echo ""
echo "🔐 Creating keystore..."

# Create keystore
keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_NAME" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$FULL_NAME, OU=$ORGANIZATION, L=$CITY, ST=$STATE, C=$COUNTRY"

echo ""
echo "✅ Keystore created successfully!"
echo ""
echo "📄 Keystore Information:"
echo "   File: $KEYSTORE_NAME"
echo "   Alias: $KEY_ALIAS"
echo "   Validity: ~27 years"
echo ""

# Generate base64 encoded keystore for GitHub secrets
KEYSTORE_BASE64=$(base64 -w 0 "$KEYSTORE_NAME")

echo "🔒 GitHub Secrets Setup"
echo "======================="
echo ""
echo "Add these secrets to your GitHub repository:"
echo "(Go to Settings > Secrets and variables > Actions)"
echo ""
echo "1. ANDROID_KEYSTORE_BASE64:"
echo "$KEYSTORE_BASE64"
echo ""
echo "2. ANDROID_KEYSTORE_PASSWORD:"
echo "$KEYSTORE_PASSWORD"
echo ""
echo "3. ANDROID_KEY_ALIAS:"
echo "$KEY_ALIAS"
echo ""
echo "4. ANDROID_KEY_PASSWORD:"
echo "$KEY_PASSWORD"
echo ""

# Create local gradle.properties for development
echo "📝 Creating local gradle.properties..."
cat > android/gradle.properties.example << EOF
# Android Signing Configuration (Example)
# Copy this to gradle.properties and fill in your values

KEYSTORE_PATH=$KEYSTORE_NAME
KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD
KEY_ALIAS=$KEY_ALIAS
KEY_PASSWORD=$KEY_PASSWORD

# Other Android settings
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
EOF

echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Keep $KEYSTORE_NAME file safe - back it up securely"
echo "   2. Never commit keystore or passwords to git"
echo "   3. Add $KEYSTORE_NAME to .gitignore"
echo "   4. Store keystore password in a password manager"
echo ""
echo "📱 Your GitHub Actions workflow will now build signed APKs!"

# Add to gitignore
if [ -f ".gitignore" ]; then
    if ! grep -q "$KEYSTORE_NAME" .gitignore; then
        echo "" >> .gitignore
        echo "# Android signing" >> .gitignore
        echo "$KEYSTORE_NAME" >> .gitignore
        echo "gradle.properties" >> .gitignore
        echo "✅ Added keystore to .gitignore"
    fi
fi
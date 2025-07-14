#!/bin/bash
set -e

echo "🚀 Fast Local Kotlin/Java Lint Check"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "modules/termux-core/android/src" ]; then
  echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
  exit 1
fi

echo -e "${BLUE}🔍 Scanning for Kotlin and Java files...${NC}"

# Find Kotlin files
kt_files=$(find modules/termux-core/android/src -name "*.kt" 2>/dev/null | head -10)
java_files=$(find modules/termux-core/android/src -name "*.java" 2>/dev/null | head -5)

kt_count=$(echo "$kt_files" | wc -l)
java_count=$(echo "$java_files" | wc -l)

echo -e "${BLUE}📋 Found $kt_count Kotlin files and $java_count Java files${NC}"

# Kotlin syntax check
if [ -n "$kt_files" ] && command -v kotlinc >/dev/null 2>&1; then
  echo -e "${BLUE}🔵 Running Kotlin syntax validation...${NC}"
  
  for kt_file in $kt_files; do
    echo -e "${BLUE}  📝 Checking: $(basename "$kt_file")${NC}"
    
    # Quick syntax check
    if kotlinc -no-stdlib -no-reflect -Xskip-metadata-version-check \
       "$kt_file" -d /tmp/kotlin-local-check >/dev/null 2>&1; then
      echo -e "${GREEN}  ✅ OK${NC}"
    else
      echo -e "${YELLOW}  ⚠️  Syntax issues detected${NC}"
      # Show the actual errors
      kotlinc -no-stdlib -no-reflect -Xskip-metadata-version-check \
        "$kt_file" -d /tmp/kotlin-local-check 2>&1 | head -5
    fi
  done
  
  rm -rf /tmp/kotlin-local-check 2>/dev/null || true
  echo -e "${GREEN}✅ Kotlin syntax check completed${NC}"
  
elif [ -n "$kt_files" ]; then
  echo -e "${YELLOW}⏭️ Kotlin compiler not available locally${NC}"
  echo -e "${BLUE}💡 Install with: sudo apt install kotlin (or brew install kotlin)${NC}"
fi

# Java compilation check  
if [ -n "$java_files" ] && command -v javac >/dev/null 2>&1; then
  echo -e "${BLUE}☕ Running Java compilation validation...${NC}"
  
  for java_file in $java_files; do
    echo -e "${BLUE}  📝 Checking: $(basename "$java_file")${NC}"
    
    # Try basic compilation
    if javac -cp "." "$java_file" -d /tmp/java-local-check >/dev/null 2>&1; then
      echo -e "${GREEN}  ✅ OK${NC}"
    else
      echo -e "${YELLOW}  ⚠️  Compilation issues (may need Android SDK dependencies)${NC}"
    fi
  done
  
  rm -rf /tmp/java-local-check 2>/dev/null || true
  echo -e "${GREEN}✅ Java compilation check completed${NC}"
  
elif [ -n "$java_files" ]; then
  echo -e "${YELLOW}⏭️ Java compiler not available locally${NC}"
  echo -e "${BLUE}💡 Java should be available if you have JDK installed${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Local lint check completed!${NC}"
echo -e "${BLUE}💡 For full compilation testing, use: gh workflow run kotlin-lint-fast.yml${NC}"
echo -e "${BLUE}🚀 For complete APK build: gh workflow run \"Build and Release APKs\"${NC}"
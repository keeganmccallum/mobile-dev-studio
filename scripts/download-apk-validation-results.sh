#!/bin/bash

# Download APK Validation Test Results
# 
# Purpose: Downloads artifacts from the latest APK validation test run
# Usage: ./scripts/download-apk-validation-results.sh [run_id]
# 
# - If run_id provided, downloads from that specific run
# - If no run_id, downloads from the latest completed run
# - Creates organized directory structure for results
# - Lists downloaded files and provides analysis commands
#
# Created to replace complex inline bash commands that were "impossible to auto approve"

set -e

echo "🔍 Downloading APK validation test results..."

# Get run ID (from parameter or latest run)
if [ -n "$1" ]; then
  RUN_ID="$1"
  echo "Using provided run ID: $RUN_ID"
else
  RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 --json databaseId --jq '.[0].databaseId')
  echo "Using latest run ID: $RUN_ID"
fi

# Create results directory
RESULTS_DIR="test-results/run-$RUN_ID"
mkdir -p "$RESULTS_DIR"
echo "📁 Created results directory: $RESULTS_DIR"

# Download debug artifacts (both debug and release builds)
echo "📥 Downloading debug artifacts..."
gh run download "$RUN_ID" --name apk-validation-debug-debug-artifacts --dir "$RESULTS_DIR" 2>/dev/null || echo "  ⚠️  Debug build artifacts not found"
gh run download "$RUN_ID" --name apk-validation-release-debug-artifacts --dir "$RESULTS_DIR" 2>/dev/null || echo "  ⚠️  Release build artifacts not found"

# List downloaded files
echo ""
echo "📋 Downloaded files:"
ls -la "$RESULTS_DIR/" || echo "  ⚠️  No files downloaded"

# Check for screenshots to determine crash point
echo ""
echo "🖼️  Screenshot analysis:"
find "$RESULTS_DIR" -name "*.png" -type f | sort || echo "  ⚠️  No screenshots found"

echo ""
echo "✅ Download complete!"
echo ""
echo "🔍 Next steps:"
echo "  - Check screenshots: ls -la $RESULTS_DIR/*.png"
echo "  - View logs: find $RESULTS_DIR -name '*.log' -exec cat {} \\;"
echo "  - Analysis: Check which screenshots exist to identify crash point"
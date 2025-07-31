#!/bin/bash

# Monitor Test Progress with Intermediate Downloads
# 
# Purpose: Monitor APK validation test and download results as they become available
# Usage: ./scripts/monitor-test-progress.sh
# 
# - Checks test status every 60 seconds
# - Downloads partial results if available
# - Provides progress updates and analysis

set -e

echo "🔍 Starting test progress monitoring..."

# Get the latest test run ID  
RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 --json databaseId --jq '.[0].databaseId')
echo "📋 Monitoring run ID: $RUN_ID"

# Monitor for up to 30 minutes (30 checks)
for i in {1..30}; do
  status=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].status')
  conclusion=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].conclusion')
  
  echo "Check $i/30: Status: $status, Conclusion: $conclusion"
  
  # Try to download partial results
  echo "  📥 Attempting to download partial results..."
  ./scripts/download-apk-validation-results.sh > /dev/null 2>&1 || echo "  ⚠️  No results available yet"
  
  # Check if we have any screenshots
  if ls test-results/run-$RUN_ID/*.png 2>/dev/null | head -1 > /dev/null; then
    SCREENSHOT_COUNT=$(ls test-results/run-$RUN_ID/*.png 2>/dev/null | wc -l)
    echo "  📸 Screenshots found: $SCREENSHOT_COUNT"
    
    # Check latest screenshot
    LATEST_SCREENSHOT=$(ls -t test-results/run-$RUN_ID/*.png 2>/dev/null | head -1)
    if [ -n "$LATEST_SCREENSHOT" ]; then
      SCREENSHOT_NAME=$(basename "$LATEST_SCREENSHOT")
      echo "  📷 Latest: $SCREENSHOT_NAME"
    fi
  fi
  
  # Check for error logs
  if find test-results/run-$RUN_ID -name '*error*' 2>/dev/null | head -1 > /dev/null; then
    echo "  ❌ Error logs detected!"
    find test-results/run-$RUN_ID -name '*error*' -exec basename {} \;
  fi
  
  # Exit if completed
  if [ "$status" != "in_progress" ] && [ "$status" != "queued" ]; then
    echo ""
    echo "🎯 Test completed with status: $status, conclusion: $conclusion"
    ./scripts/download-apk-validation-results.sh
    exit 0
  fi
  
  sleep 60
done

echo "⏰ Monitoring timeout after 30 minutes"
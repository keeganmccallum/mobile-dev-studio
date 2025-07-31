#!/bin/bash

# Wait for Test Completion and Download Results
# 
# Purpose: Waits for the latest APK validation test to complete and downloads results
# Usage: ./scripts/wait-and-download-results.sh
# 
# - Waits up to 10 minutes for test completion
# - Downloads results automatically when test finishes
# - Shows whether enhanced error detection is working properly

set -e

echo "⏳ Waiting for APK validation test to complete..."

# Wait up to 10 minutes
for i in {1..20}; do
  status=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].status')
  conclusion=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].conclusion')
  
  echo "Check $i/20: Status: $status, Conclusion: $conclusion"
  
  if [ "$status" != "in_progress" ] && [ "$status" != "queued" ]; then
    echo ""
    echo "🎯 Test completed with conclusion: $conclusion"
    
    echo "📥 Downloading results..."
    ./scripts/download-apk-validation-results.sh
    
    if [ "$conclusion" = "success" ]; then
      echo "⚠️  Test passed - check if this is a false positive"
    else
      echo "✅ Test failed - enhanced error detection working correctly"
    fi
    exit 0
  fi
  
  sleep 30
done

echo "❌ Test still running after 10 minutes - may have issues"
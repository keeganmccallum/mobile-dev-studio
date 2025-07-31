#!/bin/bash

# Wait for APK Validation Test Completion
# 
# Purpose: Monitors APK validation test until completion and shows result
# Usage: ./scripts/wait-for-apk-test.sh
# 
# - Polls every 30 seconds until test completes
# - Shows final result and suggests next steps
# - Avoids complex inline monitoring commands

set -e

echo "⏳ Waiting for APK validation test to complete..."

while true; do
  status=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].status')
  conclusion=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].conclusion')
  
  echo "Status: $status, Conclusion: $conclusion"
  
  if [ "$status" != "in_progress" ] && [ "$status" != "queued" ]; then
    echo ""
    echo "🎯 Test completed with conclusion: $conclusion"
    
    if [ "$conclusion" = "success" ]; then
      echo "✅ APK validation PASSED!"
      echo "🎉 Working APK confirmed!"
    else
      echo "❌ APK validation FAILED"
      echo "📥 Use: ./scripts/download-apk-validation-results.sh"
    fi
    break
  fi
  
  echo "Still running, checking again in 30 seconds..."
  sleep 30
done
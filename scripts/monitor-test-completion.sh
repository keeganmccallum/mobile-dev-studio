#!/bin/bash

# Monitor APK Validation Test Until Completion
# 
# Purpose: Continuously monitors APK validation test until it completes
# Usage: ./scripts/monitor-test-completion.sh
# 
# - Polls every 30 seconds until test status changes from in_progress
# - Shows final result and downloads artifacts automatically
# - Avoids complex inline commands that are impossible to auto-approve

set -e

echo "⏳ Monitoring APK validation test until completion..."

while true; do
  status=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].status')
  conclusion=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion --jq '.[0].conclusion')
  
  echo "Status: $status, Conclusion: $conclusion"
  
  if [ "$status" != "in_progress" ] && [ "$status" != "queued" ]; then
    echo ""
    echo "🎯 Test completed with conclusion: $conclusion"
    
    if [ "$conclusion" = "success" ]; then
      echo "✅ APK validation PASSED!"
      echo "🎉 Termux functionality working!"
    else
      echo "❌ APK validation FAILED"
      echo "📥 Downloading results for analysis..."
      ./scripts/download-apk-validation-results.sh
    fi
    break
  fi
  
  sleep 30
done
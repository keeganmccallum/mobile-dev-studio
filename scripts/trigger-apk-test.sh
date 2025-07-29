#!/bin/bash

# Trigger APK Validation Test Script
# 
# Purpose: Trigger a new APK validation test and monitor its progress
# Usage: ./scripts/trigger-apk-test.sh
# 
# This script:
# 1. Triggers the APK Validation Testing workflow
# 2. Waits for it to start
# 3. Shows the status and provides the run URL
# 4. Optionally waits for completion
# 
# Options:
# --wait: Wait for test completion before exiting

set -e

WAIT_FOR_COMPLETION=false
if [[ "$1" == "--wait" ]]; then
    WAIT_FOR_COMPLETION=true
fi

echo "🚀 Triggering APK validation test..."

# Trigger the workflow
gh workflow run "APK Validation Testing"

# Wait a moment for it to start
echo "⏳ Waiting for test to start..."
sleep 10

# Get the latest run info
RUN_INFO=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion,databaseId,url)
STATUS=$(echo "$RUN_INFO" | jq -r '.[0].status')
RUN_ID=$(echo "$RUN_INFO" | jq -r '.[0].databaseId')
URL=$(echo "$RUN_INFO" | jq -r '.[0].url')

echo "📊 Test started!"
echo "Run ID: $RUN_ID"
echo "Status: $STATUS"
echo "URL: $URL"

if [[ "$WAIT_FOR_COMPLETION" == "true" ]]; then
    echo "⏳ Waiting for completion..."
    while [[ "$STATUS" == "in_progress" || "$STATUS" == "queued" ]]; do
        sleep 30
        RUN_INFO=$(gh run list --workflow="APK Validation Testing" --limit 1 --json status,conclusion)
        STATUS=$(echo "$RUN_INFO" | jq -r '.[0].status')
        CONCLUSION=$(echo "$RUN_INFO" | jq -r '.[0].conclusion')
        echo "Status: $STATUS"
    done
    
    echo "✅ Test completed with result: $CONCLUSION"
else
    echo "💡 Use 'gh run list --workflow=\"APK Validation Testing\" --limit 1' to check status"
    echo "💡 Use './scripts/download-test-results.sh' to download results when complete"
fi
#!/bin/bash

# View GitHub Actions Logs
# 
# Purpose: Views the raw GitHub Actions logs for debugging workflow issues
# Usage: ./scripts/view-github-logs.sh [run_id]
# 
# - If run_id provided, shows logs for that specific run
# - If no run_id, shows logs for the latest APK validation run
# - Filters for relevant output from the validation script

set -e

echo "📋 Viewing GitHub Actions logs..."

# Get run ID (from parameter or latest run)
if [ -n "$1" ]; then
  RUN_ID="$1"
  echo "Using provided run ID: $RUN_ID"
else
  RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 --json databaseId --jq '.[0].databaseId')
  echo "Using latest run ID: $RUN_ID"
fi

echo ""
echo "🔍 Raw logs from run $RUN_ID:"
echo "================================"

# Get the logs and filter for our validation script output
gh run view "$RUN_ID" --log | grep -A 50 -B 5 "validate-apk.sh\|Verifying installation\|Installation successful\|Package verification" || {
  echo "No validation script output found in logs"
  echo ""
  echo "📋 Full log available with:"
  echo "gh run view $RUN_ID --log"
}
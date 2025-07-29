#!/bin/bash

# Quick Debug Script
# 
# Purpose: Get the latest test failure report quickly
# Usage: ./scripts/quick-debug.sh
# 
# This script gets the latest APK validation failure report

set -e

echo "🔍 Getting latest test failure info..."

# Get latest run ID (simple approach without jq)
RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 | head -1 | awk '{print $NF}' | cut -d'Z' -f1 | rev | cut -d'T' -f2- | rev)
echo "Latest run: $RUN_ID"

# Create results directory  
mkdir -p "test-results/latest"

# Try to download the release report
echo "Downloading release report..."
gh run download "$RUN_ID" --name "apk-validation-release-report" --dir "test-results/latest" 2>/dev/null && echo "✅ Release report downloaded" || echo "❌ No release report"

# Show the report if it exists
if [ -f "test-results/latest/validation-report-release.md" ]; then
    echo "📄 Latest test report:"
    cat "test-results/latest/validation-report-release.md"
fi
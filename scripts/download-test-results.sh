#!/bin/bash

# Download APK Validation Test Results Script
# 
# Purpose: Download and organize artifacts from the latest APK validation test run
# Usage: ./scripts/download-test-results.sh
# 
# This script:
# 1. Gets the latest APK validation test run ID
# 2. Creates a unique directory for the results
# 3. Downloads all available artifacts
# 4. Lists the contents for quick inspection
# 
# Output: Creates test-results/run-[ID]/ with all artifacts

set -e

echo "📥 Downloading latest APK validation test results..."

# Get the latest run ID
RUN_ID=$(gh run list --workflow="APK Validation Testing" --limit 1 --json databaseId --jq '.[0].databaseId')
echo "Run ID: $RUN_ID"

# Create unique directory
RESULTS_DIR="test-results/run-$RUN_ID"
mkdir -p "$RESULTS_DIR"

# Get available artifacts
echo "Available artifacts:"
ARTIFACTS=$(gh api repos/:owner/:repo/actions/runs/$RUN_ID/artifacts --jq -r '.artifacts[].name')
echo "$ARTIFACTS"

# Download each artifact
for artifact in $ARTIFACTS; do
    echo "Downloading $artifact..."
    gh run download $RUN_ID --name "$artifact" --dir "$RESULTS_DIR" 2>/dev/null || echo "Failed to download $artifact"
done

echo "📁 Results downloaded to: $RESULTS_DIR"
echo "Contents:"
ls -la "$RESULTS_DIR"

echo "✅ Download complete!"
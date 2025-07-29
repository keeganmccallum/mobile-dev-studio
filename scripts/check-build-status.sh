#!/bin/bash

# Check Build Status Script
# 
# Purpose: Check the status of various GitHub Actions workflows
# Usage: ./scripts/check-build-status.sh [workflow-name]
# 
# This script:
# 1. Shows status of recent workflow runs
# 2. Can filter by specific workflow name
# 3. Provides quick overview of build pipeline health
# 
# Examples:
# ./scripts/check-build-status.sh                           # All workflows
# ./scripts/check-build-status.sh "APK Validation Testing"  # Specific workflow

set -e

WORKFLOW_FILTER="$1"

echo "📊 Checking build status..."

if [[ -n "$WORKFLOW_FILTER" ]]; then
    echo "Filtered by: $WORKFLOW_FILTER"
    gh run list --workflow="$WORKFLOW_FILTER" --limit 5
else
    echo "All recent workflows:"
    gh run list --limit 10
fi

# Show current branch and commit
echo ""
echo "📍 Current branch: $(git branch --show-current)"
echo "📍 Latest commit: $(git log --oneline -1)"

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  Uncommitted changes detected"
    git status --short
fi
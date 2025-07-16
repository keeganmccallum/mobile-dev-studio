#!/bin/bash

# Test script for Claude Code authentication setup
# This script helps verify that Claude Code CLI is properly configured

set -e

echo "🔧 Testing Claude Code CLI Authentication Setup"
echo "=============================================="

# Check if Claude CLI is installed
if ! command -v claude-code &> /dev/null; then
    echo "❌ Claude Code CLI not found. Installing..."
    curl -fsSL https://claude.ai/cli/install.sh | sh
    export PATH="$HOME/.claude/bin:$PATH"
fi

echo "✅ Claude Code CLI found"

# Check if config exists
if [ ! -f "$HOME/.claude/config.json" ]; then
    echo "❌ Claude Code config not found"
    echo "Please run the setup first:"
    echo "  mkdir -p \$HOME/.claude"
    echo "  echo '{\"session_token\": \"YOUR_SESSION_TOKEN\"}' > \$HOME/.claude/config.json"
    exit 1
fi

echo "✅ Claude Code config found"

# Test basic authentication
echo "🧪 Testing Claude Code authentication..."
if claude-code --help &> /dev/null; then
    echo "✅ Claude Code CLI responding"
else
    echo "❌ Claude Code CLI authentication failed"
    echo "Please check your session token in \$HOME/.claude/config.json"
    exit 1
fi

# Test with a simple prompt
echo "🧪 Testing Claude Code with simple prompt..."
echo "What is 2+2?" | claude-code --stdin > /tmp/claude_test.txt

if [ -s /tmp/claude_test.txt ]; then
    echo "✅ Claude Code responding to prompts"
    echo "Response preview:"
    head -n 3 /tmp/claude_test.txt
else
    echo "❌ Claude Code not responding to prompts"
    echo "Please check your session token and internet connection"
    exit 1
fi

# Test file processing
echo "🧪 Testing Claude Code file processing..."
cat > /tmp/test_file.txt << EOF
# Test File
This is a test file for Claude Code CLI.
Please respond with "File processed successfully" if you can read this.
EOF

if claude-code --file /tmp/test_file.txt > /tmp/claude_file_test.txt; then
    echo "✅ Claude Code file processing works"
else
    echo "❌ Claude Code file processing failed"
    exit 1
fi

# Cleanup
rm -f /tmp/claude_test.txt /tmp/claude_file_test.txt /tmp/test_file.txt

echo ""
echo "🎉 All tests passed! Claude Code CLI is properly configured."
echo ""
echo "GitHub Actions Setup Checklist:"
echo "- [ ] Add CLAUDE_SESSION_TOKEN secret to GitHub repository"
echo "- [ ] Enable 'Read and write permissions' for GitHub Actions"
echo "- [ ] Enable 'Allow GitHub Actions to create and approve pull requests'"
echo "- [ ] Test the workflow by triggering it manually"
echo ""
echo "You can now use the auto-fix workflow in your GitHub Actions!"
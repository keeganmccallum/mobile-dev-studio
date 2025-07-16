# 🤖 Claude Code Auto-Fix System

This system automatically fixes CI build errors using Claude Code CLI and your Claude Pro account.

## 🚀 Quick Start

1. **Get your Claude session token** (see setup guide)
2. **Add `CLAUDE_SESSION_TOKEN` secret** to your GitHub repository
3. **Enable workflow permissions** in repository settings
4. **Trigger the workflow** when CI fails or manually

## 📋 Features

### Automatic Triggers
- ✅ Detects CI failures on main branch
- ✅ Detects CI failures in pull requests
- ✅ Creates fix branches and PRs automatically
- ✅ Iterates up to 5 times to resolve issues

### Error Types Handled
- 🔧 TypeScript compilation errors
- 🔧 Kotlin native module errors
- 🔧 Jest configuration issues
- 🔧 Babel/Metro bundler problems
- 🔧 Gradle build failures
- 🔧 Dependency issues
- 🔧 Test failures
- 🔧 Linting errors

### Smart Behavior
- 📝 Creates clear commit messages
- 📝 Provides detailed PR descriptions
- 📝 Comments on PRs with status updates
- 📝 Handles both main branch and PR failures differently

## 🛠️ Setup Instructions

### 1. Authentication Setup

```bash
# Get your Claude session token from claude.ai browser cookies
# Add it as CLAUDE_SESSION_TOKEN secret in GitHub repository settings
```

### 2. Repository Permissions

Go to Settings → Actions → General:
- ✅ Select "Read and write permissions"
- ✅ Check "Allow GitHub Actions to create and approve pull requests"

### 3. Test the Setup

```bash
# Run the test script locally (optional)
./.github/scripts/test-claude-auth.sh
```

## 🎯 Usage Scenarios

### Scenario 1: Main Branch CI Failure

```yaml
# Automatically triggers when CI fails on main
# Creates: auto-fix/ci-errors-TIMESTAMP branch
# Opens: PR with fixes against main
```

### Scenario 2: PR CI Failure

```yaml
# Automatically triggers when CI fails on PR
# Updates: The existing PR branch with fixes
# Comments: Status updates on the PR
```

### Scenario 3: Manual Trigger

```yaml
# Go to Actions → Auto-Fix CI Build Errors → Run workflow
# Options:
#   - Fix main branch issues
#   - Fix specific PR by number
#   - Fix custom branch
```

## 🔄 Workflow Process

### Phase 1: Detection
1. Monitor workflow runs for failures
2. Identify error types and patterns
3. Determine fix strategy (PR vs main)

### Phase 2: Analysis
1. Run comprehensive error checks
2. Capture build logs and error messages
3. Analyze dependency and configuration issues

### Phase 3: Fixing (Up to 5 iterations)
1. Send detailed error context to Claude Code
2. Apply suggested fixes automatically
3. Re-run tests to verify fixes
4. Iterate until resolved or max attempts

### Phase 4: Delivery
1. Commit all changes with clear messages
2. Create or update PR as appropriate
3. Provide status updates and documentation

## 📊 Monitoring

### Check Workflow Status
```bash
# Go to Actions tab in GitHub
# Look for "Auto-Fix CI Build Errors" workflow runs
# Review logs for detailed iteration information
```

### Monitor Auto-Created PRs
```bash
# Look for PRs with "🤖 Auto-fix" prefix
# Review changes and test results
# Merge when satisfied with fixes
```

### Review Comments
```bash
# Check PR comments for status updates
# Look for error summaries and fix descriptions
# Monitor iteration progress
```

## 🔧 Configuration Options

### Workflow Customization

Edit `.github/workflows/auto-fix-ci.yml`:

```yaml
# Change iteration limits
MAX_ITERATIONS=5  # Default: 5

# Adjust timeout
timeout-minutes: 45  # Default: 45

# Modify error patterns
grep -q "failed\|error\|Error\|ERROR"  # Add patterns
```

### Error Detection Patterns

```yaml
# Current patterns checked:
- npm install failures
- lint errors
- typecheck errors
- test failures
- prebuild errors
- gradle build errors
```

## 🚨 Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Check session token is valid
# Update CLAUDE_SESSION_TOKEN secret
# Verify Claude Pro account status
```

**Workflow Not Triggering**
```bash
# Check workflow permissions
# Verify webhook events are enabled
# Check branch protection rules
```

**Fixes Not Applied**
```bash
# Review Claude Code iteration logs
# Check for timeout issues
# Verify error patterns match
```

### Debug Steps

1. **Check workflow logs** in Actions tab
2. **Verify authentication** with test script
3. **Review error patterns** in CI logs
4. **Check Claude Pro credits** and rate limits
5. **Validate repository permissions**

## 💰 Cost Considerations

- Uses Claude Pro account credits
- ~5-20 credits per fix iteration
- Max 5 iterations per fix attempt
- Only runs when CI actually fails
- 45-minute timeout prevents runaway usage

## 🔒 Security Notes

- Session tokens are stored as encrypted secrets
- All changes are committed with clear attribution
- PRs are created for review before merging
- No API keys or sensitive data exposed
- Limited to repository scope only

## 🎛️ Advanced Usage

### Custom Fix Prompts

Modify the Claude prompt in the workflow:

```yaml
# Add specific instructions for your codebase
# Include architecture documentation
# Add common fix patterns
# Specify coding standards
```

### Integration with Other Workflows

```yaml
# Chain with other actions
# Add notifications (Slack, email)
# Integrate with deployment pipelines
# Add custom validation steps
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting guide above
2. Review workflow logs in Actions tab
3. Test authentication with the test script
4. Check Claude Pro account status
5. Verify repository permissions

## 🔄 Updates

To update the auto-fix system:
1. Pull latest changes from repository
2. Review new features in workflow file
3. Update authentication if needed
4. Test with manual trigger

---

**Created by:** Claude Code Auto-Fix System  
**Version:** 1.0.0  
**Last Updated:** $(date)  
**License:** MIT
# Claude Code Auto-Fix Setup Guide

This guide helps you set up the automated CI fixing system using Claude Code CLI.

## Authentication Setup

Since you want to use your Claude Pro account instead of API keys, you'll need to set up session-based authentication.

### Step 1: Get Your Claude Session Token

1. Open your browser and go to [Claude.ai](https://claude.ai)
2. Log in with your Claude Pro account
3. Open Developer Tools (F12)
4. Go to the Application/Storage tab
5. Find "Cookies" and look for the `claude.ai` domain
6. Copy the value of the `sessionKey` cookie

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and Variables → Actions
3. Click "New repository secret"
4. Name: `CLAUDE_SESSION_TOKEN`
5. Value: Paste the session token you copied
6. Click "Add secret"

### Step 3: Verify Workflow Permissions

Make sure your repository has the following permissions enabled:
- Go to Settings → Actions → General
- Under "Workflow permissions", select "Read and write permissions"
- Check "Allow GitHub Actions to create and approve pull requests"

## How It Works

The auto-fix system has two modes:

### Mode 1: Main Branch Failures
- Triggers when CI fails on main branch
- Creates a new branch with fixes
- Opens a PR with the fixes
- Iterates up to 5 times to resolve issues

### Mode 2: PR Failures  
- Triggers when CI fails on a PR
- Applies fixes directly to the PR branch
- Comments on the PR with status updates
- Iterates until fixed or max attempts reached

## Manual Triggering

You can also trigger the workflow manually:

1. Go to Actions → Auto-Fix CI Build Errors
2. Click "Run workflow"
3. Options:
   - Leave empty for main branch fixes
   - Specify PR number to fix a specific PR
   - Specify target branch for custom fixes

## Error Handling

The system handles various CI failures:
- TypeScript compilation errors
- Kotlin native module errors
- Jest configuration issues
- Babel/Metro bundler problems
- Gradle build failures
- Dependency issues
- Test failures

## Monitoring

- Check the Actions tab for workflow runs
- Look for auto-created PRs with "🤖 Auto-fix" prefix
- Review PR comments for status updates
- Monitor Claude Code iteration logs

## Troubleshooting

If the auto-fix fails:
1. Check the workflow logs in Actions tab
2. Verify the CLAUDE_SESSION_TOKEN is valid
3. Ensure Claude Pro account has sufficient credits
4. Check repository permissions
5. Review the error patterns in the logs

## Security Notes

- Session tokens expire periodically - update as needed
- The token is only used for Claude Code CLI authentication
- All changes are committed with clear attribution
- PRs are created for review before merging

## Cost Considerations

- Each iteration consumes Claude Pro credits
- Max 5 iterations per fix attempt
- Workflow has 45-minute timeout
- Only runs when CI actually fails

## Customization

You can modify the workflow by:
- Adjusting iteration limits in `.github/workflows/auto-fix-ci.yml`
- Adding specific error patterns to detect
- Customizing commit/PR messages
- Adding notification integrations
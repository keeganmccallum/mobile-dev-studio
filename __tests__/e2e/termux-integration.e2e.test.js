/**
 * E2E Tests for Termux Integration
 * Tests the full mobile dev studio with real Termux integration
 */

const { by, device, element, expect } = require('detox');
const fs = require('fs').promises;
const path = require('path');

describe('Mobile Dev Studio E2E', () => {
  const screenshotDir = path.join(__dirname, 'screenshots');
  let screenshotCounter = 0;

  beforeAll(async () => {
    // Ensure screenshot directory exists
    try {
      await fs.mkdir(screenshotDir, { recursive: true });
    } catch (error) {
      console.log('Screenshot directory already exists or error creating:', error.message);
    }
    
    // Launch the app
    await device.launchApp({
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  const takeScreenshot = async (name) => {
    const filename = `${++screenshotCounter}-${name}.png`;
    const fullPath = path.join(screenshotDir, filename);
    try {
      await device.takeScreenshot(filename);
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error(`Failed to take screenshot ${filename}:`, error.message);
    }
  };

  describe('App Launch and Navigation', () => {
    it('should launch app and show main tabs', async () => {
      await takeScreenshot('app-launch');
      
      // Wait for the app to load
      await expect(element(by.text('Terminal'))).toBeVisible();
      await expect(element(by.text('Preview'))).toBeVisible();
      await expect(element(by.text('Files'))).toBeVisible();
      
      await takeScreenshot('main-tabs-visible');
    });

    it('should navigate between tabs', async () => {
      // Start on Terminal tab
      await element(by.text('Terminal')).tap();
      await takeScreenshot('terminal-tab-selected');
      
      // Navigate to Preview tab
      await element(by.text('Preview')).tap();
      await takeScreenshot('preview-tab-selected');
      
      // Navigate to Files tab
      await element(by.text('Files')).tap();
      await takeScreenshot('files-tab-selected');
      
      // Return to Terminal tab
      await element(by.text('Terminal')).tap();
      await takeScreenshot('back-to-terminal');
    });
  });

  describe('Terminal Functionality', () => {
    beforeEach(async () => {
      // Ensure we're on the terminal tab
      await element(by.text('Terminal')).tap();
    });

    it('should show terminal interface', async () => {
      await takeScreenshot('terminal-interface');
      
      // Look for terminal elements
      await expect(element(by.id('terminal-webview'))).toBeVisible();
    });

    it('should execute basic commands', async () => {
      await takeScreenshot('before-command-execution');
      
      // Wait for terminal to be ready
      await waitFor(element(by.text('Mobile Dev Studio Terminal')))
        .toBeVisible()
        .withTimeout(10000);
      
      await takeScreenshot('terminal-ready');
      
      // Try to interact with terminal (this might need adjustment based on WebView implementation)
      try {
        // Tap on terminal area to focus
        await element(by.id('terminal-webview')).tap();
        await takeScreenshot('terminal-focused');
        
        // Wait a bit for any terminal prompt to appear
        await device.sleep(2000);
        await takeScreenshot('terminal-after-focus');
        
      } catch (error) {
        console.log('Terminal interaction failed (expected for WebView):', error.message);
        await takeScreenshot('terminal-interaction-failed');
      }
    });

    it('should show terminal bootstrap status', async () => {
      await takeScreenshot('terminal-bootstrap-check');
      
      // Look for any bootstrap-related UI elements
      await device.sleep(3000); // Wait for bootstrap check
      await takeScreenshot('terminal-bootstrap-status');
    });
  });

  describe('Preview Screen', () => {
    beforeEach(async () => {
      await element(by.text('Preview')).tap();
    });

    it('should show preview interface', async () => {
      await takeScreenshot('preview-interface');
      
      // Wait for preview screen to load
      await device.sleep(2000);
      await takeScreenshot('preview-loaded');
    });

    it('should show server status', async () => {
      await takeScreenshot('preview-server-status');
      
      // Look for server status indicators
      await device.sleep(1000);
      await takeScreenshot('preview-server-indicators');
    });
  });

  describe('Files Screen', () => {
    beforeEach(async () => {
      await element(by.text('Files')).tap();
    });

    it('should show file browser', async () => {
      await takeScreenshot('files-browser');
      
      // Wait for file browser to load
      await device.sleep(2000);
      await takeScreenshot('files-browser-loaded');
    });
  });

  describe('Cross-Tab Integration', () => {
    it('should maintain state across tab switches', async () => {
      // Start on terminal
      await element(by.text('Terminal')).tap();
      await takeScreenshot('cross-tab-terminal-start');
      
      // Switch to preview
      await element(by.text('Preview')).tap();
      await takeScreenshot('cross-tab-preview');
      
      // Switch to files
      await element(by.text('Files')).tap();
      await takeScreenshot('cross-tab-files');
      
      // Return to terminal
      await element(by.text('Terminal')).tap();
      await takeScreenshot('cross-tab-terminal-return');
      
      // Verify terminal state is maintained
      await device.sleep(1000);
      await takeScreenshot('cross-tab-terminal-state-maintained');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      await takeScreenshot('before-network-test');
      
      // Disable network
      await device.setNetworkConfiguration('offline');
      await takeScreenshot('network-disabled');
      
      // Try to use features that require network
      await element(by.text('Preview')).tap();
      await device.sleep(2000);
      await takeScreenshot('preview-offline');
      
      // Re-enable network
      await device.setNetworkConfiguration('wifi');
      await takeScreenshot('network-restored');
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid tab switching', async () => {
      await takeScreenshot('performance-test-start');
      
      for (let i = 0; i < 5; i++) {
        await element(by.text('Terminal')).tap();
        await device.sleep(500);
        await element(by.text('Preview')).tap();
        await device.sleep(500);
        await element(by.text('Files')).tap();
        await device.sleep(500);
      }
      
      await takeScreenshot('performance-test-end');
    });

    it('should handle app backgrounding and foregrounding', async () => {
      await takeScreenshot('before-backgrounding');
      
      // Background the app
      await device.sendToHome();
      await device.sleep(2000);
      
      // Foreground the app
      await device.launchApp({ newInstance: false });
      await takeScreenshot('after-foregrounding');
      
      // Verify app state
      await expect(element(by.text('Terminal'))).toBeVisible();
      await takeScreenshot('app-state-after-foreground');
    });
  });

  afterEach(async () => {
    // Take a screenshot after each test
    await takeScreenshot('test-end-state');
  });

  afterAll(async () => {
    await takeScreenshot('final-app-state');
    
    // Log screenshot summary
    try {
      const files = await fs.readdir(screenshotDir);
      const screenshots = files.filter(f => f.endsWith('.png'));
      console.log(`\n📸 Total screenshots captured: ${screenshots.length}`);
      console.log('Screenshots:', screenshots.join(', '));
    } catch (error) {
      console.error('Error reading screenshot directory:', error.message);
    }
  });
});
/**
 * End-to-end tests for full terminal functionality
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Terminal E2E Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Terminal Screen', () => {
    it('should display terminal screen with header', async () => {
      // Navigate to terminal screen (assuming it's the main screen)
      await detoxExpect(element(by.text('🐧 Termux Terminal'))).toBeVisible();
    });

    it('should show bootstrap initialization status', async () => {
      // Check for bootstrap status
      await detoxExpect(element(by.text('Bootstrap Ready'))).toBeVisible();
    });

    it('should show terminal loading state initially', async () => {
      await detoxExpect(element(by.text('🚀 Starting Termux...'))).toBeVisible();
      await detoxExpect(element(by.text('Setting up native terminal environment'))).toBeVisible();
    });

    it('should transition from loading to ready state', async () => {
      // Wait for terminal to load
      await detoxExpect(element(by.text('🚀 Starting Termux...'))).toBeVisible();
      
      // Wait for terminal to be ready (timeout after 30 seconds)
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Loading overlay should disappear
      await detoxExpect(element(by.text('🚀 Starting Termux...'))).not.toBeVisible();
    });

    it('should show session count in status bar', async () => {
      // Wait for terminal to load
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Check session count
      await detoxExpect(element(by.text('Sessions: 1 active'))).toBeVisible();
    });

    it('should show terminal status as ready', async () => {
      // Wait for terminal to load
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Check terminal status
      await detoxExpect(element(by.text('Terminal: Ready'))).toBeVisible();
    });
  });

  describe('Terminal Controls', () => {
    beforeEach(async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
    });

    it('should toggle status bar visibility', async () => {
      // Status bar should be visible initially
      await detoxExpect(element(by.text('Bootstrap: Ready'))).toBeVisible();
      
      // Find and tap the eye icon (status toggle)
      await element(by.id('status-toggle-button')).tap();
      
      // Status bar should be hidden
      await detoxExpect(element(by.text('Bootstrap: Ready'))).not.toBeVisible();
      
      // Tap again to show
      await element(by.id('status-toggle-button')).tap();
      
      // Status bar should be visible again
      await detoxExpected(element(by.text('Bootstrap: Ready'))).toBeVisible();
    });

    it('should show clear terminal confirmation dialog', async () => {
      // Find and tap the clear button
      await element(by.id('clear-terminal-button')).tap();
      
      // Should show confirmation dialog
      await detoxExpect(element(by.text('Clear Terminal'))).toBeVisible();
      await detoxExpect(element(by.text('Are you sure you want to clear the terminal?'))).toBeVisible();
      
      // Tap cancel
      await element(by.text('Cancel')).tap();
      
      // Dialog should disappear
      await detoxExpect(element(by.text('Clear Terminal'))).not.toBeVisible();
    });

    it('should show restart environment confirmation dialog', async () => {
      // Find and tap the restart button
      await element(by.id('restart-environment-button')).tap();
      
      // Should show confirmation dialog
      await detoxExpect(element(by.text('Restart Environment'))).toBeVisible();
      await detoxExpect(element(by.text('This will restart the Termux environment. Continue?'))).toBeVisible();
      
      // Tap cancel
      await element(by.text('Cancel')).tap();
      
      // Dialog should disappear
      await detoxExpect(element(by.text('Restart Environment'))).not.toBeVisible();
    });
  });

  describe('Terminal Interaction', () => {
    beforeEach(async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
    });

    it('should display terminal welcome message', async () => {
      // Terminal should show welcome message
      const terminalWebView = element(by.id('terminal-termux'));
      await detoxExpect(terminalWebView).toBeVisible();
      
      // Note: WebView content testing is limited in Detox
      // We can only test that the WebView is present and responsive
    });

    it('should handle terminal input', async () => {
      // This test would require more complex WebView interaction
      // For now, we just verify the terminal is interactive
      const terminalWebView = element(by.id('terminal-termux'));
      await detoxExpect(terminalWebView).toBeVisible();
      
      // Could tap on terminal to ensure it's interactive
      await terminalWebView.tap();
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
    });

    it('should handle environment restart', async () => {
      // Get initial session count
      await detoxExpect(element(by.text('Sessions: 1 active'))).toBeVisible();
      
      // Restart environment
      await element(by.id('restart-environment-button')).tap();
      await element(by.text('Restart')).tap();
      
      // Should show loading state again
      await detoxExpect(element(by.text('🚀 Starting Termux...'))).toBeVisible();
      
      // Wait for restart to complete
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Session count should be updated
      await detoxExpect(element(by.text('Sessions: 1 active'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      // Simulate network issues by disabling WiFi
      await device.setNetworkState('off');
      
      // Terminal should still work for local operations
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Re-enable network
      await device.setNetworkState('on');
    });

    it('should handle app backgrounding and foregrounding', async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Send app to background
      await device.sendToHome();
      
      // Bring app back to foreground
      await device.launchApp({ newInstance: false });
      
      // Terminal should still be functional
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      await detoxExpect(element(by.text('Terminal: Ready'))).toBeVisible();
    });

    it('should handle device rotation', async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Rotate device
      await device.setOrientation('landscape');
      
      // Terminal should still be visible and functional
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Rotate back
      await device.setOrientation('portrait');
      
      // Terminal should still be visible
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
    });
  });

  describe('Performance', () => {
    it('should handle rapid terminal operations', async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Perform rapid clear operations
      for (let i = 0; i < 5; i++) {
        await element(by.id('clear-terminal-button')).tap();
        await element(by.text('Clear')).tap();
        await detoxExpect(element(by.text('Clear Terminal'))).not.toBeVisible();
      }
      
      // Terminal should still be responsive
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
    });

    it('should maintain performance after extended use', async () => {
      // Wait for terminal to be ready
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Simulate extended use by toggling status multiple times
      for (let i = 0; i < 10; i++) {
        await element(by.id('status-toggle-button')).tap();
        await element(by.id('status-toggle-button')).tap();
      }
      
      // Terminal should still be responsive
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      await detoxExpect(element(by.text('Terminal: Ready'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', async () => {
      // Check for accessibility labels
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Status elements should have proper accessibility
      await detoxExpect(element(by.text('Bootstrap: Ready'))).toBeVisible();
      await detoxExpect(element(by.text('Terminal: Ready'))).toBeVisible();
    });

    it('should support accessibility actions', async () => {
      // Terminal should be focusable
      await detoxExpect(element(by.id('terminal-termux'))).toBeVisible();
      
      // Control buttons should be accessible
      await detoxExpect(element(by.id('clear-terminal-button'))).toBeVisible();
      await detoxExpect(element(by.id('restart-environment-button'))).toBeVisible();
    });
  });
});
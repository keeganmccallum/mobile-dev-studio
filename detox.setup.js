/**
 * Detox setup for E2E tests
 */

const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');

// Set the default timeout interval for all tests
jest.setTimeout(300000);

// Add test IDs to components for better test identification
beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
});

afterEach(async () => {
  await adapter.afterEach();
});

// Add custom matchers for Detox
const jestExpect = require('expect');
const detoxMatchers = require('detox/runners/jest/matchers');

jestExpect.extend(detoxMatchers);

// Configure test output
const { SpecReporter } = require('detox/runners/jest/specReporter');
const specReporter = new SpecReporter({
  colors: true,
  displayStacktrace: true,
  displayFailuresSummary: true,
  displayPendingSummary: true,
  showTiming: true,
});

// Add test IDs to components for easier testing
global.testIDs = {
  terminalScreen: 'terminal-screen',
  terminalWebView: 'terminal-termux',
  statusToggle: 'status-toggle-button',
  clearButton: 'clear-terminal-button',
  restartButton: 'restart-environment-button',
};
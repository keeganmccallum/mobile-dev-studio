#!/usr/bin/env node

/**
 * Local testing script to validate our setup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Mobile Dev Studio - Local Test Runner');
console.log('==========================================\n');

const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

function runTest(name, command, options = {}) {
  console.log(`📋 Running: ${name}`);
  
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      cwd: process.cwd(),
      ...options
    });
    
    console.log(`✅ ${name} - PASSED`);
    testResults.passed++;
    
    if (options.showOutput) {
      console.log(result.toString().trim());
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    
    if (error.stdout) {
      console.log(`   Stdout: ${error.stdout.toString().trim()}`);
    }
    
    testResults.failed++;
    return false;
  }
}

function checkDependencies() {
  console.log('🔍 Checking Dependencies\n');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`📦 Project: ${packageJson.name} v${packageJson.version}`);
  
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(`🟢 Node.js: ${nodeVersion}`);
  } catch (e) {
    console.log('❌ Node.js: Not found');
    return false;
  }
  
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`🟢 npm: ${npmVersion}`);
  } catch (e) {
    console.log('❌ npm: Not found');
    return false;
  }
  
  console.log('');
  return true;
}

function runTests() {
  console.log('🧪 Running Tests\n');
  
  // Test package.json validity
  runTest('Package.json validation', 'npm ls --depth=0', { timeout: 10000 });
  
  // Test TypeScript compilation
  runTest('TypeScript compilation', 'npx tsc --noEmit', { timeout: 30000 });
  
  // Test linting (if available)
  if (fs.existsSync('node_modules/.bin/eslint')) {
    runTest('ESLint check', 'npm run lint', { timeout: 15000 });
  } else {
    console.log('⏭️  ESLint - SKIPPED (not configured)');
    testResults.skipped++;
  }
  
  // Test Jest simple tests
  runTest('Simple unit tests', 'npx jest __tests__/unit/simple.simple.test.ts', { timeout: 30000 });
  runTest('TermuxCore simple tests', 'npx jest __tests__/unit/TermuxCore.simple.test.ts', { timeout: 30000 });
  runTest('TerminalService simple tests', 'npx jest __tests__/unit/TerminalService.simple.test.ts', { timeout: 30000 });
}

function checkProjectStructure() {
  console.log('📁 Checking Project Structure\n');
  
  const requiredFiles = [
    'package.json',
    'src/screens/TerminalScreen.tsx',
    'src/screens/PreviewScreen.tsx',
    'src/services/TerminalService.ts',
    'modules/termux-core/package.json',
    'modules/termux-core/src/index.ts',
    '__tests__/unit/simple.simple.test.ts'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log('');
  return allFilesExist;
}

function printSummary() {
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Ready for CI/CD');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please fix before pushing.');
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    const depsOk = checkDependencies();
    if (!depsOk) {
      console.log('❌ Dependencies check failed');
      process.exit(1);
    }
    
    const structureOk = checkProjectStructure();
    if (!structureOk) {
      console.log('❌ Project structure check failed');
      process.exit(1);
    }
    
    runTests();
    printSummary();
    
  } catch (error) {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTest, checkDependencies, checkProjectStructure };
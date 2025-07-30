/**
 * Expo Config Plugin for @keeganmccallum/expo-termux
 * 
 * Automatically configures Android build settings for Termux integration
 */

const { withGradleProperties, withProjectBuildGradle, withSettingsGradle, withAppBuildGradle } = require('expo/config-plugins');

function withTermuxCompatibility(config) {
  // Add Kotlin version compatibility fixes to gradle.properties
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults || [];
    
    // Add Kotlin compatibility settings if not already present
    const kotlinSettings = [
      '# Termux Kotlin compatibility',
      'kotlin.version=1.9.25',
      'kotlinVersion=1.9.25',
      'kotlin.suppressKotlinVersionCompatibilityCheck=true',
      'android.suppressKotlinVersionCompatibilityCheck=true',
      'android.suppressUnsupportedCompileSdk=35'
    ];
    
    kotlinSettings.forEach(setting => {
      const key = setting.includes('=') ? setting.split('=')[0] : setting;
      if (!config.modResults.some(prop => prop.key === key || prop.value?.includes(key))) {
        config.modResults.push({
          type: 'property',
          key: key.includes('=') ? setting.split('=')[0] : null,
          value: setting
        });
      }
    });
    
    return config;
  });
  
  // Add Kotlin version enforcement to android/build.gradle
  config = withProjectBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;
    
    // Check if our compatibility fixes are already applied
    if (!buildGradle.includes('// Termux compatibility fixes')) {
      // Add at the top after buildscript
      const termuxCompatCode = `
// Termux compatibility fixes - auto-applied by @keeganmccallum/expo-termux
ext.kotlin_version = '1.9.25'
ext.kotlinVersion = '1.9.25'
rootProject.ext.kotlin_version = '1.9.25'
rootProject.ext.kotlinVersion = '1.9.25'

`;
      
      // Insert after the buildscript block
      const buildscriptEnd = buildGradle.indexOf('}', buildGradle.indexOf('buildscript'));
      if (buildscriptEnd !== -1) {
        const insertPoint = buildGradle.indexOf('\n', buildscriptEnd) + 1;
        buildGradle = buildGradle.slice(0, insertPoint) + termuxCompatCode + buildGradle.slice(insertPoint);
      } else {
        // Fallback: add at the beginning
        buildGradle = termuxCompatCode + buildGradle;
      }
      
      config.modResults.contents = buildGradle;
    }
    
    return config;
  });
  
  // Add termux-core module to settings.gradle
  config = withSettingsGradle(config, (config) => {
    const settings = config.modResults.contents;
    
    if (!settings.includes('termux-core')) {
      config.modResults.contents = settings + `
// Termux core module - auto-linked by @keeganmccallum/expo-termux
project(':termux-core').projectDir = new File('../../modules/termux-core/android')
include ':termux-core'
`;
    }
    
    return config;
  });
  
  // Add termux-core dependency to app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    if (!buildGradle.includes('termux-core')) {
      // Find the dependencies block and add termux-core
      const depsStart = buildGradle.indexOf('dependencies {');
      if (depsStart !== -1) {
        const insertPoint = buildGradle.indexOf('\n', depsStart) + 1;
        const termuxDep = '    // Termux core module - auto-linked by @keeganmccallum/expo-termux\n    implementation project(\':termux-core\')\n';
        config.modResults.contents = buildGradle.slice(0, insertPoint) + termuxDep + buildGradle.slice(insertPoint);
      }
    }
    
    return config;
  });
  
  return config;
}

module.exports = withTermuxCompatibility;
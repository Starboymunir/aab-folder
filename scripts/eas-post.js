// scripts/eas-post.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

// 1) Generate a fresh android/ from Expo templates
run('npx expo prebuild --platform android --clean --non-interactive');

// 2) Overwrite settings.gradle with a minimal, safe version
const settingsGroovy = `pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
  // Only include the RN *main* Gradle plugin (NOT RN/Expo settings plugins)
  includeBuild(file("../node_modules/@react-native/gradle-plugin"))
}

rootProject.name = "Kingzdata"
include(":app")
`;


const androidDir = path.join('android');
if (!fs.existsSync(androidDir)) fs.mkdirSync(androidDir, { recursive: true });

const groovyPath = path.join(androidDir, 'settings.gradle');
fs.writeFileSync(groovyPath, settingsGroovy);
console.log('Rewrote android/settings.gradle to minimal variant.');

// If a Kotlin DSL file was emitted, blank it out so Gradle ignores it.
const ktsPath = path.join(androidDir, 'settings.gradle.kts');
if (fs.existsSync(ktsPath)) {
  fs.writeFileSync(ktsPath, '// intentionally disabled by build script\n');
  console.log('Disabled android/settings.gradle.kts');
}

// 3) Pin Gradle 8.6 (RN 0.74-friendly)
fs.mkdirSync('android/gradle/wrapper', { recursive: true });
fs.writeFileSync(
  'android/gradle/wrapper/gradle-wrapper.properties',
  'distributionUrl=https://services.gradle.org/distributions/gradle-8.6-all.zip\n'
);
console.log('Pinned Gradle 8.6');

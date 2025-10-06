// scripts/eas-post.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

// 1) Generate a fresh android/ from Expo templates
run('npx expo prebuild --platform android --clean --non-interactive');

// 2) Overwrite settings.gradle to expose ONLY the RN main plugin + Expo root plugin
//    (No RN *settings* plugin, no Expo *autolinking settings* plugin)
const settingsGroovy = `pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
  // React Native main Gradle plugin for :app (com.facebook.react)
  includeBuild(file("../node_modules/@react-native/gradle-plugin"))
  // Expo root project plugin (provides 'expo-root-project' used by android/build.gradle)
  includeBuild(file("../node_modules/expo/expo-gradle-plugin"))
}

rootProject.name = "Kingzdata"
include(":app")
`;

const androidDir = 'android';
if (!fs.existsSync(androidDir)) fs.mkdirSync(androidDir, { recursive: true });

const groovyPath = path.join(androidDir, 'settings.gradle');
fs.writeFileSync(groovyPath, settingsGroovy);
console.log('Rewrote android/settings.gradle (RN main + Expo root plugin only).');

// If a Kotlin DSL file exists, neutralize it so Groovy settings.gradle is used.
const ktsPath = path.join(androidDir, 'settings.gradle.kts');
if (fs.existsSync(ktsPath)) {
  fs.writeFileSync(ktsPath, '// disabled by build script\n');
  console.log('Disabled android/settings.gradle.kts');
}

// 3) Pin Gradle wrapper (RN 0.74 works well with 8.6)
fs.mkdirSync('android/gradle/wrapper', { recursive: true });
fs.writeFileSync(
  'android/gradle/wrapper/gradle-wrapper.properties',
  'distributionUrl=https://services.gradle.org/distributions/gradle-8.6-all.zip\n'
);
console.log('Pinned Gradle 8.6');

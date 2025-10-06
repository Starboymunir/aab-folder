// scripts/eas-post.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

// 1) Generate a fresh android/ from Expo templates
run('npx expo prebuild --platform android --clean --non-interactive');

// 2) Locate RN main plugin and (optionally) Expo root plugin
function findRNMainPluginDir() {
  const rnPluginPkg = require.resolve('@react-native/gradle-plugin/package.json');
  return path.dirname(rnPluginPkg);
}

function findExpoRootPluginDirOrNull() {
  // Try both layouts used by different Expo versions
  const expoPkg = require.resolve('expo/package.json');
  const expoRoot = path.dirname(expoPkg);
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'expo', 'expo-gradle-plugin'),
    path.join(expoRoot, 'expo-gradle-plugin'),
    path.join(expoRoot, 'packages', 'expo-gradle-plugin'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'build.gradle')) || fs.existsSync(path.join(c, 'build.gradle.kts'))) {
      return c;
    }
  }
  return null;
}

const rnMainPluginDir = findRNMainPluginDir();
const expoRootPluginDir = findExpoRootPluginDirOrNull();

const androidDir = path.join(process.cwd(), 'android');
fs.mkdirSync(androidDir, { recursive: true });

// paths in settings.gradle should be **relative to android/**
function relToAndroid(abs) {
  return path.relative(androidDir, abs).replace(/\\/g, '/');
}

const rnRel = relToAndroid(rnMainPluginDir);
const expoRel = expoRootPluginDir ? relToAndroid(expoRootPluginDir) : null;

// 3) Write a minimal settings.gradle that *always* includes RN main plugin,
//    and includes Expo root plugin only if we found it
let settingsGroovy = `pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
  includeBuild(file("${rnRel}")) // com.facebook.react (main plugin for :app)
`;

if (expoRel) {
  settingsGroovy += `  includeBuild(file("${expoRel}")) // expo-root-project (root plugin)\n`;
}
settingsGroovy += `}

rootProject.name = "Kingzdata"
include(":app")
`;

fs.writeFileSync(path.join(androidDir, 'settings.gradle'), settingsGroovy);
console.log('settings.gradle written with:');
console.log('  RN plugin  ->', rnRel);
console.log('  Expo plugin->', expoRel ?? '(not found, will strip usage)');

// Disable Kotlin DSL variant so Groovy file is used if present
const ktsPath = path.join(androidDir, 'settings.gradle.kts');
if (fs.existsSync(ktsPath)) {
  fs.writeFileSync(ktsPath, '// disabled by post script\n');
  console.log('Disabled android/settings.gradle.kts');
}

// 4) If Expo root plugin NOT found, remove its usage from android/build.gradle
if (!expoRel) {
  const rootBuildGradle = path.join(androidDir, 'build.gradle');
  if (fs.existsSync(rootBuildGradle)) {
    let txt = fs.readFileSync(rootBuildGradle, 'utf8');
    const before = txt;
    // Remove "id('expo-root-project')" or 'id("expo-root-project")' in plugins{...}
    txt = txt.replace(/^\s*id\s*\(\s*['"]expo-root-project['"]\s*\)\s*$/m, '');
    txt = txt.replace(/^\s*id\s+['"]expo-root-project['"]\s*$/m, '');
    if (txt !== before) {
      fs.writeFileSync(rootBuildGradle, txt);
      console.log('Removed expo-root-project from android/build.gradle (plugin not present).');
    } else {
      console.log('No expo-root-project line found in android/build.gradle (nothing to strip).');
    }
  } else {
    console.log('android/build.gradle not found — skipping expo-root-project strip.');
  }
}

// 5) Pin Gradle wrapper to 8.6 (RN 0.74 friendly)
fs.mkdirSync(path.join(androidDir, 'gradle', 'wrapper'), { recursive: true });
fs.writeFileSync(
  path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties'),
  'distributionUrl=https://services.gradle.org/distributions/gradle-8.6-all.zip\n'
);
console.log('Pinned Gradle 8.6');

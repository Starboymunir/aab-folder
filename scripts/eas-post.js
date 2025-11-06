// scripts/eas-post.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, CI: '1', ...opts.env },
  });
}

// 1) Generate a fresh android/ from Expo templates
run('npx expo prebuild --platform android --clean --non-interactive');

// 2) Resolve RN main gradle plugin path (so :app can apply id("com.facebook.react"))
const rnPluginPkg = require.resolve('@react-native/gradle-plugin/package.json');
const rnPluginDir = path.dirname(rnPluginPkg);

// Helpers
const androidDir = path.join(process.cwd(), 'android');
fs.mkdirSync(androidDir, { recursive: true });
const relToAndroid = (p) => path.relative(androidDir, p).replace(/\\/g, '/');
const rnRel = relToAndroid(rnPluginDir);

// 3) Overwrite android/settings.gradle — minimal, no Expo/RN *settings* plugins
const settingsGroovy = `pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
  // React Native main Gradle plugin for :app
  includeBuild(file("${rnRel}"))
}

rootProject.name = "Kingzdata"
include(":app")
`;
fs.writeFileSync(path.join(androidDir, 'settings.gradle'), settingsGroovy);
console.log('Wrote minimal android/settings.gradle (RN main plugin only).');

// If Kotlin DSL exists, neutralize it
const ktsPath = path.join(androidDir, 'settings.gradle.kts');
if (fs.existsSync(ktsPath)) {
  fs.writeFileSync(ktsPath, '// disabled by post script\n');
  console.log('Disabled android/settings.gradle.kts');
}

// 4) Overwrite android/build.gradle — classic buildscript, no expo-root-project
const rootBuildGradle = `buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath("com.android.tools.build:gradle:8.9.2")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.24")
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
  }
}
`;
fs.writeFileSync(path.join(androidDir, 'build.gradle'), rootBuildGradle);
console.log('Wrote minimal android/build.gradle (no expo-root-project).');

// 5) Overwrite android/app/build.gradle — no expoLibs, hardcode API 35, no ${...} anywhere
const appBuildGradle = `apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()

react {
  entryFile = file(["node", "-e", "require('expo/scripts/resolveAppEntry')", projectRoot, "android", "absolute"].execute(null, rootDir).text.trim())
  reactNativeDir = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()
  hermesCommand = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/sdks/hermesc/%OS-BIN%/hermesc"
  codegenDir = new File(["node", "--print", "require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()
  enableBundleCompression = (findProperty('android.enableBundleCompression') ?: false).toBoolean()
  cliFile = new File(["node", "--print", "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })"].execute(null, rootDir).text.trim())
  bundleCommand = "export:embed"
  autolinkLibrariesWithApp()
}

def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()
def jscFlavor = 'io.github.react-native-community:jsc-android:2026004.+'

android {
  compileSdk 35
  buildToolsVersion "35.0.0"
  ndkVersion "26.1.10909125"

  namespace 'com.anonymous.Kingsdata'

  defaultConfig {
    applicationId 'com.anonymous.Kingsdata'
    minSdkVersion 23
    targetSdkVersion 35
    versionCode 
    versionName "1.0.3"
    // Avoid JS interpolation hazards: use a constant
    buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\\"stable\\""
  }

  signingConfigs {
    debug {
      storeFile file('debug.keystore')
      storePassword 'android'
      keyAlias 'androiddebugkey'
      keyPassword 'android'
    }
  }

  buildTypes {
    debug { signingConfig signingConfigs.debug }
    release {
      signingConfig signingConfigs.debug // TODO: replace with real release keystore
      def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
      shrinkResources enableShrinkResources.toBoolean()
      minifyEnabled enableMinifyInReleaseBuilds
      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
      def enablePngCrunchInRelease = findProperty('android.enablePngCrunchInReleaseBuilds') ?: 'true'
      crunchPngs enablePngCrunchInRelease.toBoolean()
    }
  }

  packagingOptions {
    jniLibs {
      def enableLegacyPackaging = findProperty('expo.useLegacyPackaging') ?: 'false'
      useLegacyPackaging enableLegacyPackaging.toBoolean()
    }
  }

  androidResources {
    ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~'
  }
}

// Optional Fresco extras without expoLibs — use fixed versions directly
dependencies {
  implementation("com.facebook.react:react-android")

  def isGifEnabled = (findProperty('expo.gif.enabled') ?: "") == "true"
  def isWebpEnabled = (findProperty('expo.webp.enabled') ?: "") == "true"
  def isWebpAnimatedEnabled = (findProperty('expo.webp.animated') ?: "") == "true"

  if (isGifEnabled) {
    implementation("com.facebook.fresco:animated-gif:3.2.0")
  }
  if (isWebpEnabled) {
    implementation("com.facebook.fresco:webpsupport:3.2.0")
    if (isWebpAnimatedEnabled) {
      implementation("com.facebook.fresco:animated-webp:3.2.0")
    }
  }

  if (hermesEnabled.toBoolean()) {
    implementation("com.facebook.react:hermes-android")
  } else {
    implementation jscFlavor
  }
}
`;
fs.mkdirSync(path.join(androidDir, 'app'), { recursive: true });
fs.writeFileSync(path.join(androidDir, 'app', 'build.gradle'), appBuildGradle);
console.log('Wrote android/app/build.gradle (no ${} expansions; API 35 hardcoded).');

// 6) Pin Gradle 8.7
fs.mkdirSync(path.join(androidDir, 'gradle', 'wrapper'), { recursive: true });
fs.writeFileSync(
  path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties'),
  'distributionUrl=https://services.gradle.org/distributions/gradle-8.11.1-all.zip\n'
);
console.log('Pinned Gradle 8.6');

// scripts/eas-post.js
const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

// 1) Generate a fresh android/ from Expo templates
run('npx expo prebuild --platform android --clean --non-interactive');

// 2) Remove the RN *settings* plugin line that causes the build to fail on EAS
const settingsPath = 'android/settings.gradle';
if (fs.existsSync(settingsPath)) {
  let s = fs.readFileSync(settingsPath, 'utf8');

  // Remove either Groovy or KTS forms:
  //   id("com.facebook.react.settings")
  //   id 'com.facebook.react.settings'
  const before = s;
  s = s
    .replace(/^\s*id\(["']com\.facebook\.react\.settings["']\)\s*$/m, '')
    .replace(/^\s*id\s+['"]com\.facebook\.react\.settings['"]\s*$/m, '');

  if (before !== s) {
    console.log('Patched android/settings.gradle: removed com.facebook.react.settings');
    fs.writeFileSync(settingsPath, s);
  } else {
    console.log('android/settings.gradle did not contain com.facebook.react.settings (nothing to remove).');
  }
}

// 3) Pin Gradle 8.6 (stable with RN 0.74)
fs.mkdirSync('android/gradle/wrapper', { recursive: true });
fs.writeFileSync(
  'android/gradle/wrapper/gradle-wrapper.properties',
  'distributionUrl=https://services.gradle.org/distributions/gradle-8.6-all.zip\n'
);
console.log('Pinned Gradle 8.6');

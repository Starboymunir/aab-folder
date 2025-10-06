// scripts/eas-post.js
const { execSync } = require('child_process');
const fs = require('fs');

execSync('npx expo prebuild --platform android --clean --non-interactive', { stdio: 'inherit' });

fs.mkdirSync('android/gradle/wrapper', { recursive: true });
fs.writeFileSync(
  'android/gradle/wrapper/gradle-wrapper.properties',
  'distributionUrl=https://services.gradle.org/distributions/gradle-8.6-all.zip\n'
);
console.log('Pinned Gradle 8.6');

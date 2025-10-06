// scripts/eas-pre.js
try {
  const p = require.resolve('@react-native/gradle-plugin/package.json');
  console.log('RN plugin:', p);
} catch {
  console.log('RN plugin NOT FOUND (will still try prebuild)');
}

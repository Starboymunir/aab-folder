// scripts/patch-gradle-wrapper.mjs
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const zipPath = process.env.GRADLE_ZIP_PATH;
if (!zipPath) {
  console.error('GRADLE_ZIP_PATH is not set. Example: export GRADLE_ZIP_PATH="/mnt/c/Users/owner/Downloads/gradle-8.14.3-bin.zip"');
  process.exit(1);
}

// compute sha256 of the local zip
const data = await fs.readFile(zipPath);
const sha = crypto.createHash('sha256').update(data).digest('hex');

const candidates = [
  'android/gradle/wrapper/gradle-wrapper.properties',
  'build/android/gradle/wrapper/gradle-wrapper.properties',
];

let patchedAny = false;
for (const rel of candidates) {
  const file = path.join(process.cwd(), rel);
  try {
    let txt = await fs.readFile(file, 'utf8');
    const fileUrl = `file://${zipPath.replace(/\\/g, '/')}`;
    txt = txt.replace(/^distributionUrl=.*$/m, `distributionUrl=${fileUrl}`);
    if (txt.includes('distributionSha256Sum=')) {
      txt = txt.replace(/^distributionSha256Sum=.*$/m, `distributionSha256Sum=${sha}`);
    } else {
      txt += `\ndistributionSha256Sum=${sha}\n`;
    }
    if (!/^\s*networkTimeout=\d+/m.test(txt)) {
      txt += 'networkTimeout=60000\n';
    }
    await fs.writeFile(file, txt);
    console.log(`Patched ${rel} ✅`);
    patchedAny = true;
  } catch (e) {
    // ignore missing files; they'll exist in the EAS temp build dir
  }
}

if (!patchedAny) {
  console.warn('Could not find gradle-wrapper.properties yet. This is normal BEFORE the Android project is generated.');
  console.warn('In EAS local builds, this file appears under build/android during the run and this script will patch it then.');
}

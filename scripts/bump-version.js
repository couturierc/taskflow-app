#!/usr/bin/env node
/**
 * Version Bump Script
 * 
 * Usage:
 *   node scripts/bump-version.js patch  # 1.1.0 -> 1.1.1
 *   node scripts/bump-version.js minor  # 1.1.0 -> 1.2.0
 *   node scripts/bump-version.js major  # 1.1.0 -> 2.0.0
 *   node scripts/bump-version.js 1.2.3  # Set specific version
 */

const fs = require('fs');
const path = require('path');

const packageFile = path.join(__dirname, '..', 'package.json');

// Read current version from package.json (single source of truth)
const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Get bump type from command line
const bumpType = process.argv[2];

if (!bumpType) {
  console.log(`Current version: ${currentVersion}`);
  console.log('\nUsage:');
  console.log('  node scripts/bump-version.js patch  # 1.1.0 -> 1.1.1');
  console.log('  node scripts/bump-version.js minor  # 1.1.0 -> 1.2.0');
  console.log('  node scripts/bump-version.js major  # 1.1.0 -> 2.0.0');
  console.log('  node scripts/bump-version.js 1.2.3  # Set specific version');
  process.exit(0);
}

let newVersion;

if (bumpType === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else if (bumpType === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else if (bumpType === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
  newVersion = bumpType;
} else {
  console.error(`Invalid bump type: ${bumpType}`);
  console.error('Use: patch, minor, major, or a specific version like 1.2.3');
  process.exit(1);
}

// Update package.json (single source of truth)
packageJson.version = newVersion;
fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version bumped: ${currentVersion} -> ${newVersion}`);
console.log('\nFiles updated:');
console.log('  - package.json');
console.log('\nNext steps:');
console.log(`  git add package.json`);
console.log(`  git commit -m "chore: bump version to ${newVersion}"`);
console.log(`  git tag v${newVersion}`);
console.log(`  git push origin master --tags`);

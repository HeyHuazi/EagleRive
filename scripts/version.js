#!/usr/bin/env node

/**
 * 版本号同步脚本
 * 同步 package.json 和 manifest.json 的版本号
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestJsonPath = path.join(rootDir, 'manifest.json');

// 读取 package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

// 读取 manifest.json
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
const oldVersion = manifestJson.version;

// 更新 manifest.json
manifestJson.version = newVersion;

// 写回 manifest.json（保持格式）
const manifestJsonContent = JSON.stringify(manifestJson, null, 4);
fs.writeFileSync(manifestJsonPath, manifestJsonContent, 'utf8');

console.log(`✅ Version synchronized: ${oldVersion} → ${newVersion}`);
console.log(`   - package.json: ${newVersion}`);
console.log(`   - manifest.json: ${newVersion}`);

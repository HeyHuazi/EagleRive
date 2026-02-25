#!/usr/bin/env node

/**
 * Rive 运行时复制脚本
 * 从 node_modules 复制 Rive WebGL2 运行时到 viewer/lib/
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const runtimeSource = path.join(rootDir, 'node_modules', '@rive-app', 'webgl2', 'rive.wasm');
const runtimeDest = path.join(rootDir, 'viewer', 'lib', 'rive.webgl2.js');
const libDir = path.join(rootDir, 'viewer', 'lib');

// 确保 viewer/lib 目录存在
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// 检查源文件是否存在
if (!fs.existsSync(runtimeSource)) {
  console.error('❌ Rive runtime not found in node_modules/@rive-app/webgl2/');
  console.error('   Please run: npm install');
  process.exit(1);
}

// 复制文件
fs.copyFileSync(runtimeSource, runtimeDest);

const fileSize = (fs.statSync(runtimeDest).size / 1024).toFixed(2);
console.log(`✅ Rive runtime copied (${fileSize} KB)`);
console.log(`   Source: ${runtimeSource}`);
console.log(`   Dest:   ${runtimeDest}`);

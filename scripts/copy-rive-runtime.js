#!/usr/bin/env node

/**
 * Rive 运行时复制脚本
 * 从 node_modules 复制 Rive WebGL2 运行时到 viewer/lib/
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const jsRuntimeSource = path.join(rootDir, 'node_modules', '@rive-app', 'webgl2', 'rive.js');
const wasmRuntimeSource = path.join(rootDir, 'node_modules', '@rive-app', 'webgl2', 'rive.wasm');
const jsRuntimeDest = path.join(rootDir, 'viewer', 'lib', 'rive.webgl2.js');
const wasmRuntimeDest = path.join(rootDir, 'viewer', 'lib', 'rive.wasm');
const libDir = path.join(rootDir, 'viewer', 'lib');

// 确保 viewer/lib 目录存在
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// 检查源文件是否存在
if (!fs.existsSync(jsRuntimeSource)) {
  console.error('❌ Rive runtime not found in node_modules/@rive-app/webgl2/');
  console.error('   Please run: npm install');
  process.exit(1);
}

// 复制 JavaScript 运行时
fs.copyFileSync(jsRuntimeSource, jsRuntimeDest);
const jsFileSize = (fs.statSync(jsRuntimeDest).size / 1024).toFixed(2);
console.log(`✅ Rive JavaScript runtime copied (${jsFileSize} KB)`);
console.log(`   Source: ${jsRuntimeSource}`);
console.log(`   Dest:   ${jsRuntimeDest}`);

// 复制 WASM 运行时
if (fs.existsSync(wasmRuntimeSource)) {
  fs.copyFileSync(wasmRuntimeSource, wasmRuntimeDest);
  const wasmFileSize = (fs.statSync(wasmRuntimeDest).size / 1024).toFixed(2);
  console.log(`✅ Rive WASM runtime copied (${wasmFileSize} KB)`);
  console.log(`   Source: ${wasmRuntimeSource}`);
  console.log(`   Dest:   ${wasmRuntimeDest}`);
}

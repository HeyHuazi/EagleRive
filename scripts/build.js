#!/usr/bin/env node

/**
 * EagleRive 插件构建脚本
 * 构建前端资源并打包发布版本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('🔨 Building EagleRive plugin...\n');

// 1. 清理 dist 目录
console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });

fs.mkdirSync(distDir, { recursive: true });

// 2. 复制核心文件
console.log('📁 Copying core files...');
const filesToCopy = [
  { src: 'manifest.json', dest: 'manifest.json' },
  { src: 'logo.png', dest: 'logo.png' },
  { src: 'js', dest: 'js' },
  { src: 'thumbnail', dest: 'thumbnail' },
  { src: 'viewer', dest: 'viewer' },
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(rootDir, src);
  const destPath = path.join(distDir, dest);

  if (fs.statSync(srcPath).isDirectory())
    execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'inherit' });
  else fs.copyFileSync(srcPath, destPath);

  console.log(`   ✓ Copied ${src}`);
});

// 3. 安装生产依赖到 dist（sharp 用于 SVG→PNG 降级缩略图）
console.log('\n📦 Installing production dependencies...');
const distPackageJson = {
  name: 'eagle-plugin-rive',
  version: JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version,
  dependencies: { sharp: '^0.33.2' },
};
fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(distPackageJson, null, 2));
execSync('npm install --production --ignore-scripts=false', { cwd: distDir, stdio: 'inherit' });
console.log('   ✓ Installed sharp');

// 4. 合并 CSS 文件
console.log('\n🎨 Merging CSS files...');
const cssDir = path.join(rootDir, 'viewer', 'css');
const cssFiles = [
  'variables.css',
  'layout.css',
  'components.css',
  'performance.css',
  'shortcuts.css',
  'playback-controls.css',
];

let mergedCss = '';
cssFiles.forEach(file => {
  const filePath = path.join(cssDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  mergedCss += `/* ===== ${file} ===== */\n\n${content}\n\n`;
});

const mergedCssPath = path.join(distDir, 'viewer', 'css', 'merged.css');
fs.writeFileSync(mergedCssPath, mergedCss);
console.log(`   ✓ Created merged.css (${cssFiles.length} files merged)`);

// 5. JavaScript 文件保持原样（不合并，避免作用域问题）
console.log('\n📦 JavaScript files kept separate (original 11 modules)');
console.log('   ✓ Skipping JavaScript merge to prevent scope issues');

// 6. 更新 HTML 文件（只合并 CSS，保持 JavaScript 原样）
console.log('\n📝 Updating HTML file...');
const htmlPath = path.join(distDir, 'viewer', 'riv.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 只替换 CSS 链接（不替换 JavaScript），保留 WASM preload
htmlContent = htmlContent.replace(
  /<!-- CSS -->[\s\S]*?<\/head>/,
  '<!-- CSS -->\n    <link rel="stylesheet" href="./css/merged.css">\n    <!-- 预加载 WASM（与 JS 并行下载） -->\n    <link rel="preload" href="./lib/rive.wasm" as="fetch" crossorigin>\n</head>'
);

fs.writeFileSync(htmlPath, htmlContent);
console.log('   ✓ Updated riv.html (CSS merged, JS unchanged)');

// 7. 创建压缩包（可选）
console.log('\n📦 Creating distribution package...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const zipFileName = `EagleRive-v${version}.zip`;
  const zipFilePath = path.join(rootDir, zipFileName);

  // 删除旧的压缩包
  if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);

  // 创建新的压缩包
  execSync(`cd "${distDir}" && zip -r "${zipFilePath}" .`, { stdio: 'inherit' });
  console.log(`   ✓ Created ${zipFileName}`);
} catch (error) {
  console.warn('   ⚠ Failed to create zip file:', error.message);
}

console.log('\n✅ Build complete!');
console.log(`📁 Output directory: ${distDir}`);
console.log('📋 Build summary:');
console.log('   - Merged CSS: 6 files → 1 file');
console.log('   - JavaScript: 11 files (unchanged)');
console.log('   - HTML updated to use merged CSS');
console.log('\n🚀 Ready to distribute!');

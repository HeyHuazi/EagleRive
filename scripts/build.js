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
if (fs.existsSync(distDir)) 
    fs.rmSync(distDir, { recursive: true, force: true });

fs.mkdirSync(distDir, { recursive: true });

// 2. 复制核心文件
console.log('📁 Copying core files...');
const filesToCopy = [
    { src: 'manifest.json', dest: 'manifest.json' },
    { src: 'logo.png', dest: 'logo.png' },
    { src: 'thumbnail', dest: 'thumbnail' },
    { src: 'viewer', dest: 'viewer' },
];

filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(rootDir, src);
    const destPath = path.join(distDir, dest);

    if (fs.statSync(srcPath).isDirectory()) 
        execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'inherit' });
    else 
        fs.copyFileSync(srcPath, destPath);
  
    console.log(`   ✓ Copied ${src}`);
});

// 3. 合并 CSS 文件
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

// 4. 合并 JavaScript 模块
console.log('\n📦 Merging JavaScript modules...');
const jsDir = path.join(rootDir, 'viewer', 'js');
const jsFiles = [
    'utils.js',
    'animation.js',
    'state-machine.js',
    'data-binding.js',
    'playback.js',
    'playback-controls.js',
    'zoom.js',
    'ui.js',
    'performance.js',
    'shortcuts.js',
];

let mergedJs = '// EagleRive Viewer - Merged Modules\n\n';
jsFiles.forEach(file => {
    const filePath = path.join(jsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    mergedJs += `// ===== ${file} =====\n\n${content}\n\n`;
});

// 添加 app.js（主入口）
const appJsPath = path.join(jsDir, 'app.js');
const appContent = fs.readFileSync(appJsPath, 'utf8');
mergedJs += `// ===== app.js =====\n\n${appContent}\n`;

const mergedJsPath = path.join(distDir, 'viewer', 'js', 'merged.js');
fs.writeFileSync(mergedJsPath, mergedJs);
console.log(`   ✓ Created merged.js (${jsFiles.length + 1} modules merged)`);

// 5. 更新 HTML 文件（使用合并后的资源）
console.log('\n📝 Updating HTML file...');
const htmlPath = path.join(distDir, 'viewer', 'riv.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 替换 CSS 链接
htmlContent = htmlContent.replace(
    /<!-- CSS -->[\s\S]*?<!--\/CSS -->/,
    '<!-- CSS -->\n    <link rel="stylesheet" href="./css/merged.css">\n<!-- /CSS -->'
);

// 替换 JS 链接
htmlContent = htmlContent.replace(
    /<!-- Modules -->[\s\S]*?<!-- Main App -->[\s\S]*?<script src="\.\/js\/app\.js"><\/script>/,
    '<!-- Merged JavaScript -->\n    <script src="./js/merged.js"></script>'
);

fs.writeFileSync(htmlPath, htmlContent);
console.log('   ✓ Updated riv.html to use merged resources');

// 6. 创建压缩包（可选）
console.log('\n📦 Creating distribution package...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const version = packageJson.version;
    const zipFileName = `EagleRive-v${version}.zip`;
    const zipFilePath = path.join(rootDir, zipFileName);

    // 删除旧的压缩包
    if (fs.existsSync(zipFilePath)) 
        fs.unlinkSync(zipFilePath);
  

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
console.log('   - Merged JS: 11 modules → 1 file');
console.log('   - HTML updated to use merged resources');
console.log('\n🚀 Ready to distribute!');

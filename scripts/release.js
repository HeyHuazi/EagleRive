#!/usr/bin/env node

/**
 * EagleRive 自动化发布脚本
 *
 * 功能：
 * 1. 运行测试（可选）
 * 2. 构建项目
 * 3. 创建发布压缩包
 * 4. 生成 Git 标签
 * 5. 提取 CHANGELOG
 *
 * 用法：
 *   node scripts/release.js              # 运行测试 + 构建
 *   node scripts/release.js --skip-tests # 跳过测试，直接构建
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const pkg = require('../package.json');
const version = pkg.version;

// 解析命令行参数
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');

console.log(`🚀 Releasing EagleRive v${version}...\n`);

// 1. 运行测试（可选）
if (!skipTests) {
  console.log('🧪 Running tests...');
  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Tests failed! Aborting release.');
    console.error('💡 Use --skip-tests to skip tests and build anyway:');
    console.error('   npm run release -- --skip-tests');
    process.exit(1);
  }
} else {
  console.log('⏭️  Skipping tests (--skip-tests flag)\n');
}

// 2. 运行构建
console.log('🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build complete!\n');
} catch (error) {
  console.error('❌ Build failed! Aborting release.');
  process.exit(1);
}

// 3. 创建发布压缩包
console.log('📦 Creating release package...');
const distDir = path.join(rootDir, 'dist');
const zipFileName = `EagleRive-v${version}.zip`;
const zipFilePath = path.join(rootDir, zipFileName);

// 删除旧的压缩包
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

// 创建新的压缩包
try {
  execSync(`cd "${distDir}" && zip -r "${zipFilePath}" .`, { stdio: 'inherit' });
  const stats = fs.statSync(zipFilePath);
  const fileSize = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✅ Created ${zipFileName} (${fileSize} MB)\n`);
} catch (error) {
  console.error('❌ Failed to create zip file:', error.message);
  process.exit(1);
}

// 4. 生成发布说明
console.log('📝 Generating release notes...');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const releaseNotesPath = path.join(rootDir, `RELEASE_NOTES_v${version}.md`);

try {
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');

    // 提取当前版本的发布说明
    const versionSection = changelog.match(
      new RegExp(`##\\s+v${version.replace('.', '\\.')}[\\s\\S]*?(?=##\\s+v|$)`, 'i')
    );

    if (versionSection) {
      const releaseNotes = `# EagleRive v${version} Release Notes\n\n` +
        versionSection[0].replace(`## v${version}`, '').trim();

      fs.writeFileSync(releaseNotesPath, releaseNotes);
      console.log(`✅ Release notes saved to: ${releaseNotesPath}\n`);
    } else {
      console.warn('⚠️  No changelog entry found for v${version}');
      console.log('   Please update CHANGELOG.md manually\n');
    }
  }
} catch (error) {
  console.warn('⚠️  Failed to generate release notes:', error.message);
}

// 5. 创建 Git 标签（可选，需要确认）
console.log('🏷️  Git tag status:');
try {
  const tag = `v${version}`;
  const existingTag = execSync(`git tag -l "${tag}"`, { encoding: 'utf-8' }).trim();

  if (existingTag) {
    console.log(`   ℹ️  Git tag "${tag}" already exists`);
    console.log('   To create a new release, consider bumping the version first:');
    console.log('     npm run version:patch  # 1.0.0 → 1.0.1');
    console.log('     npm run version:minor  # 1.0.0 → 1.1.0');
    console.log('     npm run version:major  # 1.0.0 → 2.0.0');
  } else {
    console.log(`   ℹ️  Git tag "${tag}" does not exist yet`);
    console.log('   To create the tag, run:');
    console.log(`     git tag -a ${tag} -m "Release v${version}"`);
    console.log(`     git push origin ${tag}`);
  }
} catch (error) {
  console.warn('   ⚠️  Failed to check git tag:', error.message);
}

// 6. 发布总结
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Release ready!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 Package: ${zipFileName}`);
console.log(`📁 Directory: ${distDir}`);
console.log(`📝 Version: ${version}`);
console.log('\n📋 Next steps:');
console.log('  1. Test the plugin in Eagle');
console.log('  2. Create GitHub release with the zip file');
console.log('  3. Update CHANGELOG.md if needed');
console.log('  4. Push git tag if not already done');
console.log('\n💡 Quick publish command:');
console.log(`   gh release create v${version} ${zipFileName} --title "v${version}" --notes-file ${releaseNotesPath}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

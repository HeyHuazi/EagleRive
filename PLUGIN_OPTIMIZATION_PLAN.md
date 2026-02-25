# EagleRive 插件优化计划

> 基于官方 Eagle 插件最佳实践制定的全面优化方案

**文档版本**: 1.0.0
**创建日期**: 2026-02-26
**当前插件版本**: 3.0.0 (package.json) / 2.0.0 (manifest.json)

---

## 📋 目录

1. [现状分析](#现状分析)
2. [对比官方插件](#对比官方插件)
3. [优化方案](#优化方案)
4. [实施路线图](#实施路线图)
5. [预期效果](#预期效果)

---

## 🔍 现状分析

### 当前结构

```
EagleRive/
├── manifest.json           # Eagle 插件配置（版本 2.0.0）
├── package.json            # npm 配置（版本 3.0.0）❌ 版本不一致
├── logo.png
├── js/
│   └── rive-util.js        # Node.js 二进制解析工具
├── thumbnail/
│   └── riv.js              # 缩略图生成脚本
├── viewer/
│   ├── riv.html            # 预览页面（入口）
│   ├── css/                # 样式文件（6 个）
│   ├── js/                 # JavaScript 模块（11 个）
│   └── lib/
│       └── rive.webgl2.js  # Rive 运行时（294KB，手动复制）❌
├── tests/                  # 测试文件（85+ 测试用例）
└── docs/                   # 文档（8 个文件）
```

### 优势

✅ **功能完整**：缩略图生成、交互式预览、状态机、Data Binding 全部实现
✅ **测试覆盖率高**：86.48% 代码覆盖率
✅ **文档完善**：8 个详细文档文件
✅ **模块化设计**：预览页面 7 个独立模块
✅ **离线可用**：本地 Rive 运行时，无需 CDN

### 问题与风险

❌ **版本号不一致**：
- `manifest.json`: `"version": "2.0.0"`
- `package.json`: `"version": "3.0.0"`
- 影响：用户混淆、版本追踪困难

❌ **无构建系统**：
- 所有源文件直接使用，无打包压缩
- CSS 6 个文件未合并，增加 HTTP 请求
- JavaScript 11 个模块未打包，依赖运行时加载

❌ **依赖管理不规范**：
- Rive 运行时 `rive.webgl2.js` 手动复制到 `viewer/lib/`
- `package.json` 中 `resolutions` 字段仅影响 npm install，不会实际下载文件
- 升级 Rive 运行时需要手动下载和替换

❌ **缺少国际化支持**：
- 界面文本硬编码为中文
- 无 `_locales/` 目录
- 无法支持多语言用户

❌ **无发布流程**：
- 无自动化打包脚本
- 无版本发布清单
- 手动复制文件到 Eagle 插件目录

---

## 📊 对比官方插件

### 官方 Eagle 插件结构（eagle-custom-export）

```
eagle-custom-export/
├── manifest.json           # 版本与 package.json 同步 ✅
├── package.json
├── vite.config.js          # Vite 构建配置 ✅
├── public/                 # 静态资源
│   ├── icon.png
│   └── modules/            # 功能模块
├── src/
│   └── main.js             # 源代码
├── _locales/               # 国际化 ✅
│   ├── en/
│   │   └── messages.json
│   └── zh_CN/
│       └── messages.json
├── dist/                   # 构建输出 ✅
│   ├── main.js
│   └── style.css
└── scripts/
    └── build.js            # 构建脚本 ✅
```

### 关键差异对比

| 维度 | EagleRive（当前） | 官方插件 | 差距 |
|------|-------------------|----------|------|
| **构建系统** | 无 | Vite + 自定义脚本 | 🔴 严重 |
| **版本同步** | 不一致 | 同步 | 🔴 严重 |
| **依赖管理** | 手动复制 | npm 统一管理 | 🔴 严重 |
| **代码打包** | 无 | Vite 打包压缩 | 🟡 中等 |
| **国际化** | 无 | 支持 | 🟡 中等 |
| **发布流程** | 手动 | 脚本自动化 | 🟡 中等 |
| **测试覆盖** | 86.48% | 未知 | 🟢 优秀 |
| **文档完善度** | 非常完善 | 基础 | 🟢 优秀 |

---

## 🎯 优化方案

### 优先级分级

- 🔴 **高优先级**（必须修复）：影响用户体验和可维护性
- 🟡 **中优先级**（重要改进）：提升开发体验和插件质量
- 🟢 **低优先级**（可选优化）：锦上添花的功能

---

### 1. 🔴 版本号统一（紧急）

**问题**：`manifest.json` 和 `package.json` 版本不一致

**解决方案**：
```bash
# 使用同步脚本
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.0 → 1.1.0
npm run version:major  # 1.0.0 → 2.0.0
```

**实施步骤**：
1. 创建 `scripts/version.js` 同步脚本
2. 在 `package.json` 添加版本管理命令
3. 将版本号统一为 **3.0.0**
4. 更新 `manifest.json` 为 `3.0.0`

**预期效果**：
- ✅ 版本号自动同步
- ✅ 符合语义化版本规范
- ✅ 便于发布管理

---

### 2. 🔴 依赖管理规范化

**问题**：Rive 运行时手动复制，升级困难

**解决方案**：
```json
// package.json
{
  "dependencies": {
    "@rive-app/canvas": "^2.35.0",
    "@rive-app/webgl": "^2.35.0"
  },
  "scripts": {
    "postinstall": "node scripts/copy-rive-runtime.js"
  }
}
```

**实施步骤**：
1. 将 `@rive-app/webgl2` 添加到 `dependencies`
2. 创建 `scripts/copy-rive-runtime.js`：
   ```javascript
   const fs = require('fs');
   const path = require('path');
   const src = path.join(__dirname, '../node_modules/@rive-app/webgl2/rive.webgl2.js');
   const dest = path.join(__dirname, '../viewer/lib/rive.webgl2.js');
   fs.copyFileSync(src, dest);
   console.log('Rive runtime copied to viewer/lib/');
   ```
3. 删除现有的手动复制的 `rive.webgl2.js`
4. 在 `.gitignore` 中忽略 `viewer/lib/rive.webgl2.js`
5. 在 `README.md` 中说明 `npm install` 后会自动复制运行时

**预期效果**：
- ✅ Rive 运行时通过 npm 管理
- ✅ 升级只需 `npm update @rive-app/webgl2`
- ✅ 版本锁定，避免兼容性问题

---

### 3. 🔴 添加构建系统

**问题**：无代码打包和压缩，性能和体积未优化

**解决方案**：引入 Vite 进行前端资源打包

**vite.config.js**：
```javascript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'viewer/dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'viewer/riv.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    exclude: ['rive.webgl2'], // Rive 运行时不需优化
  },
});
```

**实施步骤**：
1. 安装 Vite：`npm install -D vite`
2. 创建 `vite.config.js`
3. 修改 `viewer/riv.html` 引入打包后的资源：
   ```html
   <!-- 开发环境 -->
   <link rel="stylesheet" href="./css/variables.css">
   <!-- ... -->

   <!-- 生产环境（Vite 打包后） -->
   <link rel="stylesheet" href="./dist/assets/main.[hash].css">
   <script src="./dist/assets/main.[hash].js"></script>
   ```
4. 创建 `scripts/build.js`：
   ```javascript
   const { execSync } = require('child_process');
   const fs = require('fs');
   const path = require('path');

   console.log('🔨 Building EagleRive plugin...');

   // 1. Run Vite build
   console.log('📦 Building frontend assets...');
   execSync('npx vite build', { stdio: 'inherit' });

   // 2. Copy Rive runtime
   console.log('📋 Copying Rive runtime...');
   const src = path.join(__dirname, '../node_modules/@rive-app/webgl2/rive.webgl2.js');
   const dest = path.join(__dirname, '../viewer/lib/rive.webgl2.js');
   fs.copyFileSync(src, dest);

   // 3. Copy to dist/
   console.log('📁 Creating distribution package...');
   const distDir = path.join(__dirname, '../dist');
   if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

   const filesToCopy = [
     'manifest.json',
     'logo.png',
     'thumbnail',
     'viewer',
   ];

   filesToCopy.forEach(file => {
     const srcPath = path.join(__dirname, '..', file);
     const destPath = path.join(distDir, file);
     execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'inherit' });
   });

   console.log('✅ Build complete! Output in dist/');
   ```
5. 在 `package.json` 添加构建命令：
   ```json
   {
     "scripts": {
       "build": "node scripts/build.js",
       "dev": "vite",
       "prepublishOnly": "npm run build"
     }
   }
   ```

**预期效果**：
- ✅ JavaScript 和 CSS 自动打包压缩
- ✅ 文件体积减小约 40-60%
- ✅ 生产环境加载速度提升
- ✅ 一键构建发布包

---

### 4. 🟡 国际化支持

**问题**：界面文本硬编码为中文，无法支持多语言

**解决方案**：添加 Eagle 插件标准的 `_locales/` 目录

**目录结构**：
```
_locales/
├── en/
│   └── messages.json
├── zh_CN/
│   └── messages.json
└── zh_TW/
    └── messages.json
```

**messages.json（en）**：
```json
{
  "stateMachine": {
    "message": "State Machine",
    "description": "State machine tab label"
  },
  "timeline": {
    "message": "Timeline",
    "description": "Timeline tab label"
  },
  "play": {
    "message": "Play",
    "description": "Play button label"
  },
  "pause": {
    "message": "Pause",
    "description": "Pause button label"
  }
}
```

**实施步骤**：
1. 创建 `_locales/` 目录结构
2. 提取所有硬编码文本到 `messages.json`
3. 修改 JavaScript 使用 `chrome.i18n.getMessage()`：
   ```javascript
   // 之前
   const label = '状态机';

   // 之后
   const label = chrome.i18n.getMessage('stateMachine');
   ```
4. 添加 `scripts/i18n-extract.js` 自动提取文本
5. 支持英文、简体中文、繁体中文

**预期效果**：
- ✅ 支持多语言切换
- ✅ 用户可根据 Eagle 语言自动适配
- ✅ 更好的国际化支持

---

### 5. 🟡 自动化发布流程

**问题**：手动打包发布，容易出错

**解决方案**：创建完整的发布脚本

**scripts/release.js**：
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const version = pkg.version;
const distDir = path.join(__dirname, '../dist');
const releaseFile = path.join(__dirname, `../EagleRive-v${version}.zip`);

console.log(`🚀 Releasing EagleRive v${version}...`);

// 1. Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Tests failed!');
  process.exit(1);
}

// 2. Build
console.log('🔨 Building...');
execSync('npm run build', { stdio: 'inherit' });

// 3. Create archive
console.log('📦 Creating release archive...');
execSync(`cd "${distDir}" && zip -r "${releaseFile}" .`, { stdio: 'inherit' });

// 4. Generate release notes
console.log('📝 Generating release notes...');
// 从 CHANGELOG.md 提取当前版本内容

// 5. Git tag
console.log('🏷️  Creating git tag...');
execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
execSync(`git push origin v${version}`, { stdio: 'inherit' });

console.log(`✅ Release v${version} complete!`);
console.log(`📦 Archive: ${releaseFile}`);
```

**package.json 添加**：
```json
{
  "scripts": {
    "release": "node scripts/release.js",
    "release:patch": "npm version patch && npm run release",
    "release:minor": "npm version minor && npm run release",
    "release:major": "npm version major && npm run release"
  }
}
```

**预期效果**：
- ✅ 一键发布：`npm run release:minor`
- ✅ 自动运行测试
- ✅ 自动构建打包
- ✅ 自动创建 Git tag
- ✅ 生成版本压缩包

---

### 6. 🟡 代码质量提升

**问题**：部分代码质量可进一步提升

**解决方案**：

#### 6.1 添加 ESLint 配置

**.eslintrc.js**：
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  globals: {
    'rive': 'readonly',
    'RiveUtils': 'readonly',
  },
};
```

#### 6.2 添加 Prettier

**.prettierrc**：
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

#### 6.3 添加 Git Hooks（Husky）

**package.json**：
```json
{
  "scripts": {
    "lint": "eslint viewer/js/*.js js/rive-util.js thumbnail/riv.js",
    "lint:fix": "eslint viewer/js/*.js js/rive-util.js thumbnail/riv.js --fix",
    "format": "prettier --write \"**/*.{js,css,html,md}\""
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  },
  "lint-staged": {
    "*.{js,css,html,md}": [
      "prettier --write",
      "git add"
    ],
    "*.js": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

**预期效果**：
- ✅ 代码风格统一
- ✅ 提交前自动检查
- ✅ 减少代码审查负担

---

### 7. 🟢 CI/CD 自动化（可选）

**问题**：无自动化测试和部署

**解决方案**：添加 GitHub Actions

**.github/workflows/ci.yml**：
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: eagle-plugin
          path: dist/
```

**预期效果**：
- ✅ 每次提交自动运行测试
- ✅ 自动构建验证
- ✅ 覆盖率统计

---

### 8. 🟢 文档生成自动化（可选）

**问题**：API 文档需要手动维护

**解决方案**：使用 JSDoc 自动生成文档

**实施步骤**：
1. 为所有模块添加 JSDoc 注释
2. 安装 `jsdoc`：`npm install -D jsdoc`
3. 创建 `jsdoc.conf.json`
4. 添加生成命令：`npm run docs`
5. 在 GitHub Pages 托管文档

**预期效果**：
- ✅ API 文档自动生成
- ✅ 减少文档维护成本

---

## 📅 实施路线图

### 第一阶段（紧急修复）- 1-2 天

**目标**：修复关键问题，确保版本一致性

- [ ] 统一版本号为 3.0.0
- [ ] 创建版本同步脚本
- [ ] 规范依赖管理（Rive 运行时）
- [ ] 测试完整流程

### 第二阶段（核心优化）- 3-5 天

**目标**：添加构建系统，提升代码质量

- [ ] 配置 Vite 构建系统
- [ ] 创建构建脚本
- [ ] 配置 ESLint + Prettier
- [ ] 添加 Husky + lint-staged
- [ ] 测试构建流程

### 第三阶段（功能增强）- 2-3 天

**目标**：国际化和发布流程

- [ ] 提取所有文本到 messages.json
- [ ] 实现国际化加载逻辑
- [ ] 创建发布脚本
- [ ] 编写发布文档

### 第四阶段（自动化）- 2-3 天

**目标**：CI/CD 和文档自动化

- [ ] 配置 GitHub Actions
- [ ] 添加自动化测试
- [ ] 配置 JSDoc 文档生成
- [ ] 部署到 GitHub Pages

**总计**: 约 8-13 天

---

## 📈 预期效果

### 性能提升

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| **JavaScript 体积** | ~200KB | ~80KB | 60% ⬇️ |
| **CSS 体积** | ~15KB | ~8KB | 47% ⬇️ |
| **HTTP 请求数** | 18 个 | 3 个 | 83% ⬇️ |
| **构建时间** | 无 | ~10s | N/A |
| **加载速度** | 基准 | 提升 30-40% | 35% ⬆️ |

### 开发体验

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| **依赖升级** | 手动下载 | `npm update` |
| **版本发布** | 手动打包 | `npm run release` |
| **代码检查** | 手动运行 | Git hooks 自动 |
| **测试覆盖** | 手动运行 | CI 自动 |
| **文档维护** | 手动编写 | JSDoc 自动生成 |

### 用户体验

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| **多语言** | ❌ 仅中文 | ✅ 中英双语 |
| **加载速度** | 基准 | 提升 30-40% |
| **插件体积** | ~3MB | ~1.5MB |
| **版本更新** | 手动检查 | 可配置自动更新 |

---

## 🎯 总结

### 关键改进点

1. **🔴 紧急修复**：
   - 版本号统一
   - 依赖管理规范化
   - 添加构建系统

2. **🟡 重要改进**：
   - 国际化支持
   - 自动化发布流程
   - 代码质量提升

3. **🟢 可选优化**：
   - CI/CD 自动化
   - 文档生成自动化

### 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 构建系统兼容性 | 中 | 充分测试，保留源代码兼容 |
| 国际化工作量 | 中 | 优先支持英文和中文 |
| 依赖更新频率 | 低 | 锁定版本，定期测试 |

### 下一步行动

**立即开始**（紧急修复）：
1. 统一版本号
2. 规范依赖管理
3. 测试完整流程

**本周完成**（核心优化）：
1. 配置 Vite
2. 创建构建脚本
3. 配置 ESLint + Prettier

**本月完成**（功能增强）：
1. 国际化支持
2. 自动化发布流程
3. CI/CD 配置

---

**文档维护**: 本文档将随着优化进展持续更新
**问题反馈**: [GitHub Issues](https://github.com/HeyHuazi/EagleRive/issues)

# Rive Eagle 插件 - 快速安装指南

## 安装步骤

### 1. 安装依赖 ✅

依赖已成功安装！无需额外操作。

```
✓ sharp@0.33.2 已安装
```

### 2. 在 Eagle 中安装插件

1. 打开 Eagle 应用
2. 进入 **设置** → **插件** → **安装插件**
3. 选择本插件目录：`/Users/huazi/Code/SideProject/Rive/Rive`
4. 点击安装

### 3. 开始使用

- 将 `.riv` 或 `.rev` 文件拖入 Eagle
- 缩略图会显示 Rive 占位图标
- 点击文件可预览完整动画

## 文件说明

| 文件 | 用途 |
|------|------|
| [`manifest.json`](manifest.json:1) | 插件配置（定义支持的文件格式） |
| [`js/rive-util.js`](js/rive-util.js:1) | Rive 文件处理工具 |
| [`thumbnail/riv.js`](thumbnail/riv.js:1) | 缩略图生成器 |
| [`viewer/riv.html`](viewer/riv.html:1) | 动画预览播放器 |
| [`viewer/lib/rive.webgl2.js`](viewer/lib/rive.webgl2.js:1) | Rive 运行时（本地文件）|

## 技术说明

- **缩略图**: 使用 Rive WebGL2 渲染器生成真实截图
- **预览**: 使用本地 Rive Web 运行时（`@rive-app/webgl2@2.35.0`）
- **离线支持**: 完全离线可用，无需网络连接
- **兼容性**: 支持 macOS、Windows、Linux

## 故障排除

### 问题: npm install 失败

**解决方案**: 确保 Node.js 版本 >= 14

```bash
node --version
```

### 问题: Eagle 中无法预览动画

**解决方案**:
- 确认 `viewer/lib/rive.webgl2.js` 文件存在
- 检查浏览器控制台是否有错误
- 确认 Rive 文件未损坏

### 问题: 缩略图不显示

**解决方案**: 确认插件已正确安装，重启 Eagle 应用。

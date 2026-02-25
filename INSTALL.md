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

### 缩略图渲染策略

缩略图使用本地 Rive WebGL2 渲染器生成真实截图，完全离线可用：

**渲染流程**：
1. 加载本地 Rive 运行时（`viewer/lib/rive.webgl2.js`，294KB）
2. 创建离屏 canvas 并挂载到 DOM
3. **拦截 `getContext`** 注入 `preserveDrawingBuffer: true`，让 Rive 渲染器自行创建 WebGL2 上下文并配置所需扩展
4. 加载 .riv 文件，获取画板尺寸并调整 canvas
5. 播放第一个状态机（无状态机时回退到第一个动画）
6. 等待 **30 帧** `requestAnimationFrame` 确保羽化/模糊/圆角等高级效果渲染完成
7. `toBlob()` 截图写入 PNG

**关键技术点**：
- **不预创建 WebGL2 上下文**：通过拦截 `getContext` 让 Rive 渲染器自行创建，确保所有 WebGL 扩展（羽化、模糊、圆角、混合模式等）被正确启用
- **`autoBind: true`**：确保 Data Binding 的初始值正确应用
- **`shouldDisableRiveListeners: true`**：优化性能，禁用不需要的 Rive 事件监听
- **`enableRiveAssetCDN: false`**：强制使用本地资源，确保完全离线
- **30 帧等待**：让 WebGL2 管线有足够时间完成复杂效果的合成

### 预览功能

- **渲染器**：使用本地 `@rive-app/webgl2@2.35.0`（与缩略图相同版本）
- **离线支持**：完全离线可用，无需网络连接
- **兼容性**：支持 macOS、Windows、Linux

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

# Rive 预览 — Eagle 插件

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/HeyHuazi/EagleRive)
[![Tests](https://img.shields.io/badge/tests-118%20passing-brightgreen.svg)](https://github.com/HeyHuazi/EagleRive)

---

## 插件简述

**Rive 预览** 是一款 Eagle 格式扩展插件，为 Rive 动画文件（`.riv` 和 `.rev` 格式）提供完整的预览支持。

### 主要功能

- **缩略图生成** - 自动为 Rive 文件生成高质量缩略图
- **交互式预览** - 完整的动画播放控制、状态机交互、数据绑定编辑
- **多语言支持** - 界面语言自动跟随 Eagle 应用设置（简体中文 / English）
- **完全离线** - Rive 运行时已内置，无需网络连接

### 支持的文件格式

| 格式   | 说明            | 预览              | 缩略图      |
| ------ | --------------- | ----------------- | ----------- |
| `.riv` | Rive 运行时格式 | ✅ 完整支持       | ✅ 自动生成 |
| `.rev` | Rive 编辑器备份 | ℹ️ 提示打开编辑器 | ✅ 占位图   |

---

## 插件使用说明

### 安装方法

1. 下载插件 releases 包（`eaglerive-plugin.zip`）
2. 打开 Eagle，进入 **设置 → 插件 → 安装插件**
3. 选择下载的 zip 文件或插件目录
4. 安装完成，导入 `.riv` 文件即可使用

### 预览界面功能

#### 底部控制栏

| 功能              | 说明                        |
| ----------------- | --------------------------- |
| ▶️ 播放 / ⏸️ 暂止 | 控制动画播放状态            |
| 🔄 重新播放       | 从头开始播放动画            |
| ⏱️ 速度滑块       | 调节播放速度（0.1x - 3.0x） |
| 🔍+ / 🔍-         | 放大 / 缩小画布             |
| 🎯 重置           | 恢复默认缩放和位置          |
| ❓ 帮助           | 查看所有快捷键              |

#### 右侧面板

**状态机**（默认标签）

- 触发器（Trigger）：点击触发
- 布尔值（Boolean）：开关切换
- 数值（Number）：输入框调整
- Data Binding：ViewModel 属性编辑

**时间线**

- 动画列表，点击切换播放

#### 背景切换

控制栏左侧可切换三种背景：

- ⬜ 透明棋盘格
- ⬜ 白色
- ⬛ 黑色

### 键盘快捷键

| 快捷键              | 功能     |
| ------------------- | -------- |
| `Ctrl + 0`          | 重置缩放 |
| `Ctrl + +`          | 放大     |
| `Ctrl + -`          | 缩小     |
| `按住 Space + 拖动` | 平移画布 |
| `Ctrl + 滚轮`       | 缩放     |

### 性能监控

右上角实时显示 FPS：

- 🟢 绿色：≥ 50 FPS
- 🟠 橙色：30-49 FPS
- 🔴 红色：< 30 FPS

### 常见问题

**Q: 为什么 `.rev` 文件无法预览？**
A: `.rev` 是 Rive 编辑器的备份格式，需要用 Rive 编辑器打开。

**Q: FPS 显示红色怎么办？**
A: 可能是动画过于复杂或设备性能不足，尝试降低播放速度。

**Q: 如何调整播放速度？**
A: 使用底部控制栏的速度滑块，范围 0.1x - 3.0x。

---

## 版本日志

### v1.0.0 (2026-02-27)

**新功能**

- ✨ Poison Loader 加载动画（来自 Rive Marketplace）
- ✨ 快捷键帮助面板
- ✨ FPS 实时监控（绿/橙/红指示）
- ✨ 动画速度控制（0.1x - 3.0x）
- ✨ 国际化支持（简体中文 / English，自动跟随 Eagle 设置）

**优化**

- 🎨 优化控制栏布局
- 🎨 统一使用 Glow UI Icons
- 🎨 支持高分屏（动态 DPR）

**修复**

- 🐛 修复时间线播放控制问题
- 🐛 修复 Tab 切换时动画冲突
- 🐛 修复重新播放后速度丢失

### v0.2.0

**新功能**

- ✨ 状态机模式支持
- ✨ 状态机 Inputs 控制（Trigger、Boolean、Number）
- ✨ Data Binding（ViewModel 编辑）
- ✨ 缩放与快捷键控制
- ✨ 背景切换

### v0.1.0

**初始版本**

- 🎉 首次发布
- ✨ `.riv` 和 `.rev` 文件预览
- ✨ 缩略图生成
- ✨ 基本播放控制

查看完整更新日志：[CHANGELOG.md](CHANGELOG.md)

---

## 🛠️ 开发信息

### 项目结构

```
├── manifest.json        # Eagle 插件配置
├── package.json         # npm 依赖
├── _locales/            # 国际化翻译文件
│   ├── en/              # 英文
│   └── zh_CN/           # 简体中文
├── js/
│   └── rive-util.js     # Rive 二进制解析
├── thumbnail/
│   └── riv.js           # 缩略图生成
└── viewer/
    ├── riv.html         # 预览界面
    └── js/              # 预览器模块（13 个核心模块）
```

### 模块架构

| 模块               | 职责         |
| ------------------ | ------------ |
| `app.js`           | 应用主控制器 |
| `state-machine.js` | 状态机管理   |
| `data-binding.js`  | 数据绑定     |
| `animation.js`     | 动画引擎     |
| `playback.js`      | 播放控制     |
| `zoom.js`          | 缩放导航     |
| `ui.js`            | UI 更新      |
| `shortcuts.js`     | 快捷键       |
| `i18n.js`          | 国际化核心   |
| `performance.js`   | 性能监控     |
| `utils.js`         | 工具函数     |

### 技术栈

- **渲染器**：`@rive-app/webgl2@2.35.0`（完整支持羽化/模糊等高级效果）
- **测试**：Jest + jsdom（118 单元测试通过）
- **依赖**：`sharp`（SVG → PNG 转换）

### 本地开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建插件
npm run build
```

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [Rive](https://rive.app/) - 强大的实时动画设计工具
- [Eagle](https://en.eagle.cool/) - 优秀的设计素材管理工具
- [Glow UI Icons](https://www.glowui.com/icons) - 精美的图标资源库
- [Poison Loader](https://rive.app/marketplace/59-83-poison-loader/) - 加载动画，由 [Jia-Fong Jr.](https://rive.app/community/jia-fong/) 创作

## 📮 联系方式

- 作者：Huazi
- GitHub：[@HeyHuazi](https://github.com/HeyHuazi)
- Issues：[提交问题](https://github.com/HeyHuazi/EagleRive/issues)

---

如果这个项目对你有帮助，请给一个 ⭐️ Star！

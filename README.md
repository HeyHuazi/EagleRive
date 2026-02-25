# Eagle Rive 插件

> 🎨 为 Eagle 添加 Rive 动画文件预览功能，支持 `.riv` 和 `.rev` 格式

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/yourusername/EagleRive)
[![Tests](https://img.shields.io/badge/tests-85%20passing-brightgreen.svg)](https://github.com/yourusername/EagleRive)

Eagle 格式扩展插件，为 `.riv`（运行时）和 `.rev`（编辑器备份）文件提供缩略图生成与交互式预览。

## ✨ 功能特性

### 缩略图生成

- 使用本地 `@rive-app/webgl2@2.35.0` 渲染器生成真实截图，完全离线可用
- 优先渲染状态机第一帧，无状态机时回退到第一个动画
- 通过拦截 `getContext` 确保 WebGL2 扩展正确启用（羽化、模糊、混合模式等）
- 等待 30 帧让复杂视觉效果完全渲染
- `.rev` 文件自动生成占位缩略图（运行时无法加载编辑器格式）
- 渲染失败时自动降级为 SVG 占位图

### 交互式预览

- **WebGL2 渲染**：使用 `@rive-app/webgl2` 渲染器，完整支持羽化/模糊等高级效果
- **完全离线可用**：Rive 运行时已包含在插件中，无需网络连接
- **多画板切换**：多画板文件自动显示画板选择器
- **播放控制**：
  - 状态机与时间线模式智能切换
  - 播放/暂停、重新播放按钮
  - **速度控制**：0.1x - 3.0x 可调节播放速度
  - 切换到时间线标签页时自动播放动画
  - 仅在状态机标签页下可进行状态机交互
- **缩放与导航**：
  - 放大、缩小、重置缩放按钮
  - 鼠标滚轮缩放（Ctrl + 滚轮）
  - 按住空格键拖动平移画布
- **性能监控**：右上角实时显示 FPS，彩色指示（绿/橙/红）
- **快捷键帮助**：点击右下角 ? 按钮查看所有快捷键
- **背景切换**：透明棋盘格、白色、黑色三种背景（位于控制栏左侧）
- **深色/浅色主题**：跟随 Eagle 主题自动适配
- **扁平化设计**：白色基底、轻阴影、清晰边框的现代界面风格
- **默认 Contain + 居中**：画板自适应容器、垂直水平居中
- **Remix Icon 图标**：统一精美的图标风格

### 侧边栏布局

**文件信息**（常驻显示，Tab 上方）
- 文件名、尺寸、动画数、状态机数、视图模型数
- 多画板时显示画板选择器
- 背景切换（白色/黑色/透明棋盘格色板）

**状态机**（默认标签）
- 状态机选择与 Inputs 控制
  - 触发器（Trigger）：2 列按钮网格，点击触发
  - 布尔值（Boolean）：开关切换
  - 数值（Number）：输入框调整（支持小数 step=any）
  - 各类型分组显示，带数量徽标
- 无状态机时自动隐藏控制区
- **Data Binding**（状态机下方，无 ViewModel 时自动隐藏）
  - ViewModel 选择与属性编辑
  - 支持属性类型：String、Number、Boolean、Color、Enum（下拉选择）、Trigger
  - List 显示项数，嵌套 ViewModel 递归展示（最多 3 层）
  - 类型标准化：通过 `normalizeType()` 同时兼容 WASM 数字枚举与高层 API 字符串枚举
  - 多层回退策略获取属性描述（VMI.properties → ViewModel.properties → WASM runtime）
  - VMI 获取策略：autoBind 默认实例 → viewModelByName → defaultViewModel → instance()
  - 属性修改实时反映到画布
  - 状态机切换时自动停止旧状态机，避免多实例冲突
  - 使用 `autoBind: true` 自动绑定默认 ViewModel 实例

**时间线**
- 动画列表，点击切换播放
- 切换到时间线标签页时自动播放动画

### 键盘快捷键

| 按键 | 功能 |
|------|------|
| Ctrl+0 | 重置缩放 |
| Ctrl++ | 放大 |
| Ctrl+- | 缩小 |
| 按住 Space + 拖动 | 平移画布 |
| Ctrl + 滚轮 | 缩放 |

### `.rev` 文件处理

`.rev` 是 Rive 编辑器备份格式，运行时无法加载。插件会：
- 生成带文件信息的占位缩略图
- 预览页面显示提示，引导用户在 Rive 编辑器中打开

## 项目结构

```
├── manifest.json        # Eagle 插件配置
├── package.json         # npm 依赖（sharp）
├── logo.png             # 插件图标
├── js/
│   └── rive-util.js     # Rive 二进制解析 & SVG 占位图生成
├── thumbnail/
│   └── riv.js           # 缩略图生成（WebGL2 渲染截图）
└── viewer/
    └── riv.html         # 交互式预览界面
```

## 安装

```bash
npm install
```

依赖：
- `sharp`：SVG → PNG 转换（占位缩略图降级方案）

资源：
- 图标：[Glow UI Icons](https://www.glowui.com/icons)

将插件目录安装到 Eagle：**设置 → 插件 → 安装插件** → 选择本目录。

## 技术实现

### 渲染器

缩略图和预览均使用 `@rive-app/webgl2@2.35.0`（WebGL2 渲染器），支持：
- 羽化（Feather）
- 模糊（Blur）
- 混合模式（Blend Modes）
- 其他需要 GPU 加速的视觉效果

### 缩略图截图流程

**技术实现**：

1. 在 DOM 中创建离屏 canvas 并挂载
2. **拦截 `getContext`** 注入 `preserveDrawingBuffer: true` 和 `antialias: true`
   - **关键**：不预创建 WebGL2 上下文，让 Rive 渲染器自行创建
   - 这样 Rive 能正确启用所有需要的 WebGL 扩展（羽化/模糊/圆角/混合模式等）
3. 加载 Rive 文件（使用 `buffer` 参数）
4. 配置渲染选项：
   - `autoBind: true` - 确保 Data Binding 初始值正确应用
   - `shouldDisableRiveListeners: true` - 禁用不需要的事件监听，优化性能
   - `enableRiveAssetCDN: false` - 强制使用本地资源，确保完全离线
5. 获取画板尺寸并调整 canvas 大小
6. 播放第一个状态机（无状态机时回退到第一个动画）
7. 等待 **30 帧** `requestAnimationFrame` 确保羽化/模糊/圆角等高级效果渲染完成
8. `toBlob()` 截图写入 PNG

**为什么是 30 帧？**
- 羽化、模糊、混合模式等高级效果需要多帧才能完成 WebGL2 管线的合成
- 30 帧（约 0.5-1 秒）能确保大多数复杂效果完全渲染

### 二进制解析（rive-util.js）

纯 Node.js 解析 `.riv` 文件头部：
- 读取魔数 `RIVE`、主/次版本号
- 解析 Rive 7+ Table of Contents（属性键列表 + 位数组）
- 遍历对象查找 Artboard，提取宽高和画板名
- 检测 `.rev` 格式（头部包含 `ART` 标记但无 `RIVE` 魔数）

## 🧪 测试

项目包含 85+ 单元测试，核心功能覆盖率达 86.48%。

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 📋 版本历史

### v3.0.0 (2026-02-25) - Sprint 1 & 2
**新功能**
- ✨ 快捷键帮助面板（点击 ? 图标查看）
- ✨ FPS 实时监控（右上角彩色指示）
- ✨ 动画速度控制（0.1x - 3.0x 滑块）
- 🎨 优化控制栏布局（背景左侧 | 缩放+帮助右侧）
- 🎨 所有按钮更新为 Remix Icon 风格

**修复**
- 🐛 修复时间线播放控制不生效的问题
- 🐛 修复 Tab 切换时动画和状态机同时播放的冲突
- 🐛 修复重新播放后速度丢失的问题
- 🐛 修复模块引用不一致导致的错误

**改进**
- ♻️ 代码模块化重构，7 个独立模块
- ✅ 85+ 单元测试通过
- 📈 86.48% 代码覆盖率

### v2.0.0
- ✨ 支持状态机模式
- ✨ 添加缩放控制功能
- ✨ 添加 Data Binding 支持

### v1.0.0
- 🎉 首次发布
- ✨ 支持 `.riv` 和 `.rev` 文件预览

查看完整更新日志：[CHANGELOG.md](CHANGELOG.md)

## 🤝 贡献指南

欢迎贡献代码！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细流程。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📝 文档

- [安装指南](INSTALL.md)
- [用户手册](USER_GUIDE.md)
- [架构设计](ARCHITECTURE.md)
- [测试文档](TESTING.md)
- [API 参考](API.md)

## ❓ 常见问题

### Q: 为什么预览时一直显示 loading？
A: Rive 运行时已包含在插件中，支持完全离线使用。如果仍显示 loading，请检查文件是否损坏或路径是否正确。

### Q: 缩放功能不生效？
A: 确保使用的是最新版本插件。如果问题依旧，请在 [Issues](https://github.com/yourusername/EagleRive/issues) 中反馈。

### Q: FPS 显示红色？性能问题？
A: FPS < 30 会显示红色。可能是动画过于复杂或设备性能不足。尝试降低播放速度或使用更简单的动画。

### Q: 支持导出动画吗？
A: 暂不支持，但已在规划中（PNG 序列和 GIF 导出）。

### Q: 如何调整播放速度？
A: 使用底部控制栏的速度滑块，范围 0.1x - 3.0x。

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [Rive](https://rive.app/) - 强大的实时动画设计工具
- [Eagle](https://en.eagle.cool/) - 优秀的设计素材管理工具
- [Remix Icon](https://remixicon.com/) - 精美的开源图标库

## 📮 联系方式

- 作者：Huazi
- GitHub：[@yourusername](https://github.com/yourusername)
- Issues：[提交问题](https://github.com/yourusername/EagleRive/issues)

---

如果这个项目对你有帮助，请给一个 ⭐️ Star！

# Rive — Eagle 格式扩展插件

Eagle 格式扩展插件，为 `.riv`（运行时）和 `.rev`（编辑器备份）文件提供缩略图生成与交互式预览。

## 功能特性

### 缩略图生成

- 使用 `@rive-app/webgl2` 渲染器生成真实截图（状态机/动画第一帧）
- 支持羽化、模糊、混合模式等高级视觉效果
- `.rev` 文件自动生成占位缩略图（运行时无法加载编辑器格式）
- 渲染失败时自动降级为 SVG 占位图

### 交互式预览

- **WebGL2 渲染**：使用 `@rive-app/webgl2` 渲染器，完整支持羽化/模糊等高级效果
- **多画板切换**：多画板文件自动显示画板选择器
- **播放控制**：状态机与时间线模式智能切换，切换到时间线标签页时自动播放动画，仅在状态机标签页下可进行状态机交互
- **背景切换**：透明棋盘格、白色、黑色三种背景（位于文件信息区）
- **深色/浅色主题**：跟随 Eagle 主题自动适配
- **扁平化设计**：白色基底、轻阴影、清晰边框的现代界面风格，参考 Paper 设计系统
- **默认 Contain + 居中**：画板自适应容器、垂直水平居中

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

1. 在 DOM 中创建离屏 canvas
2. 预创建 WebGL2 上下文（`preserveDrawingBuffer: true`）
3. 加载 Rive 文件，获取画板尺寸并调整 canvas
4. 播放第一个状态机（或第一个动画）
5. 等待 10 帧 `requestAnimationFrame` 确保渲染管线完成
6. `toBlob()` 截图写入 PNG

### 二进制解析（rive-util.js）

纯 Node.js 解析 `.riv` 文件头部：
- 读取魔数 `RIVE`、主/次版本号
- 解析 Rive 7+ Table of Contents（属性键列表 + 位数组）
- 遍历对象查找 Artboard，提取宽高和画板名
- 检测 `.rev` 格式（头部包含 `ART` 标记但无 `RIVE` 魔数）

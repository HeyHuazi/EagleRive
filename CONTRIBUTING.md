# 贡献指南

感谢你对 Eagle Rive 插件的关注！我们欢迎任何形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

## 🤝 行为准则

- 尊重所有贡献者
- 欢迎新手提问
- 建设性讨论
- 专注于项目改进

## 🚀 如何贡献

### 贡献方式

1. **报告问题** - 发现 Bug 或功能建议
2. **提交代码** - 修复 Bug 或添加新功能
3. **完善文档** - 改进文档质量
4. **分享项目** - 帮助更多人了解项目

### 开始之前

1. 阅读 [README.md](README.md) 了解项目
2. 查看 [ARCHITECTURE.md](ARCHITECTURE.md) 理解架构
3. 搜索 [Issues](https://github.com/yourusername/EagleRive/issues) 确认问题未被讨论

## 🛠️ 开发环境设置

### 环境要求

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **Git** >= 2.0.0

### 安装步骤

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆到本地**
   ```bash
   git clone https://github.com/YOUR_USERNAME/EagleRive.git
   cd EagleRive
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **运行测试**
   ```bash
   npm test
   ```

5. **在 Eagle 中测试**
   - 打开 Eagle
   - 设置 → 插件 → 安装插件
   - 选择你的本地目录

### 项目结构

```
EagleRive/
├── manifest.json          # 插件配置
├── package.json           # 项目依赖
├── js/
│   └── rive-util.js       # Rive 文件处理
├── thumbnail/
│   └── riv.js             # 缩略图生成
├── viewer/
│   ├── riv.html           # 预览器主页面
│   ├── js/
│   │   ├── app.js         # 应用入口
│   │   ├── animation.js   # 动画模块
│   │   ├── state-machine.js  # 状态机模块
│   │   ├── playback.js    # 播放控制
│   │   ├── zoom.js        # 缩放控制
│   │   ├── shortcuts.js   # 快捷键面板
│   │   ├── performance.js # FPS 监控
│   │   └── ...
│   └── css/               # 样式文件
└── tests/                 # 测试文件
```

## 📐 代码规范

### JavaScript 规范

#### 1. 模块化

使用 IIFE（立即执行函数表达式）封装模块：

```javascript
(function() {
    'use strict';

    // 私有变量
    const privateVar = 'secret';

    // 公共 API
    window.ModuleName = {
        publicMethod() {
            // ...
        }
    };
})();
```

#### 2. 命名规范

- **模块名**：PascalCase（如 `Playback`, `Animation`）
- **函数名**：camelCase（如 `playAnimation`, `resetZoom`）
- **常量**：UPPER_SNAKE_CASE（如 `MAX_SPEED`, `DEFAULT_FPS`）
- **私有函数**：前缀下划线（如 `_helperFunction`）

#### 3. 注释规范

```javascript
/**
 * 播放指定动画
 * @param {Rive} riveInstance - Rive 实例
 * @param {string} animName - 动画名称
 * @returns {boolean} 是否成功播放
 */
function playAnim(riveInstance, animName) {
    // 实现代码
}
```

#### 4. 错误处理

```javascript
function riskyOperation() {
    try {
        // 可能出错的代码
    } catch (error) {
        console.error('[ModuleName] 操作失败:', error);
        // 优雅降级
        return false;
    }
}
```

#### 5. DOM 操作

```javascript
// 检查 DOM 是否存在
function initModule() {
    const element = document.querySelector('.my-element');
    if (!element) {
        console.warn('[ModuleName] 元素未找到');
        return;
    }

    // 操作 DOM
}
```

### CSS 规范

#### 1. 命名规范

- 使用 BEM 或语义化命名
- 类名使用 kebab-case（如 `.zoom-controls`, `.play-button`）

```css
/* 推荐 */
.play-button { }

/* 不推荐 */
.playButton { }
.play_button { }
```

#### 2. 组织顺序

```css
.my-component {
    /* 1. 布局 */
    display: flex;
    position: absolute;

    /* 2. 盒模型 */
    width: 100px;
    padding: 10px;

    /* 3. 排版 */
    font-size: 14px;
    color: #333;

    /* 4. 背景 */
    background: white;

    /* 5. 其他 */
    transition: all 0.3s;
}
```

#### 3. 响应式

```css
/* 移动优先 */
.component {
    width: 100%;
}

@media (min-width: 768px) {
    .component {
        width: 50%;
    }
}
```

### 测试规范

#### 1. 测试文件结构

```javascript
describe('ModuleName', () => {
    beforeEach(() => {
        // 每个测试前的准备
    });

    describe('公共方法', () => {
        it('应该正确处理正常输入', () => {
            // 测试代码
        });

        it('应该处理边界情况', () => {
            // 测试代码
        });

        it('应该优雅处理错误', () => {
            // 测试代码
        });
    });
});
```

#### 2. 测试覆盖率目标

- 全局覆盖率：≥ 50%
- 核心模块（playback, animation, zoom）：≥ 80%

## 📝 提交规范

### Commit 消息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat` - 新功能
- `fix` - 问题修复
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构（不添加功能也不修复 Bug）
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建或辅助工具变更

### 示例

```bash
# 新功能
git commit -m "feat(playback): 添加速度控制功能"

# 问题修复
git commit -m "fix(zoom): 修复重置缩放后无法缩放的问题"

# 文档更新
git commit -m "docs(readme): 更新安装说明"

# 重构
git commit -m "refactor(animation): 简化动画切换逻辑"
```

### 中文 Commit 消息

项目支持中文 commit 消息：

```bash
git commit -m "feat: 添加 FPS 监控功能

- 实时显示帧率
- 彩色指示器（绿/橙/红）
- 位于右上角"
```

## 🔄 Pull Request 流程

### 1. 创建分支

```bash
# 功能分支
git checkout -b feature/your-feature-name

# 修复分支
git checkout -b fix/your-bug-fix

# 文档分支
git checkout -b docs/your-doc-update
```

### 2. 进行更改

- 编写代码
- 添加测试
- 更新文档（如需要）
- 运行测试确保通过

```bash
# 运行测试
npm test

# 代码检查
npm run lint

# 自动修复
npm run lint:fix
```

### 3. 提交更改

```bash
git add .
git commit -m "feat: 描述你的更改"
```

### 4. 推送到 GitHub

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 Pull Request，填写：

**Title（标题）**：
```
feat: 添加新功能名称
```

**Description（描述）**：
```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构

## 描述
简要描述这个 PR 的目的和实现方式。

## 测试
描述如何测试这些更改：
- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 在 Eagle 中验证

## 截图（如适用）
添加截图或 GIF 演示新功能。

## 相关 Issue
Closes #issue-number
```

### 6. 等待审查

- 维护者会审查你的代码
- 可能需要修改，请及时响应
- 审查通过后会合并到主分支

## 🐛 问题反馈

### 提交 Issue 之前

1. 搜索现有 Issues，确认问题未被报告
2. 查看 [USER_GUIDE.md](USER_GUIDE.md) 的故障排除部分
3. 准备好复现步骤和环境信息

### Issue 模板

```markdown
## 问题描述
简要描述问题

## 复现步骤
1. 打开 Eagle
2. 导入 `.riv` 文件
3. 点击播放按钮
4. 出现错误

## 期望行为
应该正常播放动画

## 实际行为
动画不播放，控制台报错

## 环境信息
- Eagle 版本：
- 操作系统：
- 插件版本：
- Rive 文件：（如果可以分享）

## 截图
添加截图或录屏

## 额外信息
其他相关说明
```

### 功能请求模板

```markdown
## 功能描述
简要描述你希望添加的功能

## 使用场景
描述什么时候会使用这个功能

## 建议实现
如果你有想法，描述可能的实现方式

## 替代方案
描述你目前使用的替代方案

## 优先级
- [ ] 高优先级
- [ ] 中优先级
- [ ] 低优先级
```

## 📜 许可证

通过贡献代码，你同意你的贡献将使用与项目相同的 [MIT License](LICENSE)。

## 🙏 致谢

感谢所有贡献者！你的贡献让这个项目变得更好。

---

有任何问题？欢迎在 [Issues](https://github.com/yourusername/EagleRive/issues) 中讨论。

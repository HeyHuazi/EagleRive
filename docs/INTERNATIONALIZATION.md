# 国际化（i18n）指南

## 概述

EagleRive 插件支持多语言，目前支持以下语言：
- 🇨🇳 简体中文（zh_CN）- 默认
- 🇺🇸 英文（en）

## 文件结构

```
_locales/
├── en/
│   └── messages.json
└── zh_CN/
    └── messages.json
```

## 使用方法

### 1. 在 HTML 中引入国际化脚本

在 `viewer/riv.html` 的 `<head>` 中添加：

```html
<script src="../../scripts/i18n.js"></script>
```

### 2. 在 JavaScript 中获取翻译文本

```javascript
// 方法 1：使用 getMessage
const title = i18n.getMessage('viewer.title');

// 方法 2：使用简写 t()
const title = i18n.t('viewer.title');

// 带点号的嵌套键
const fileLabel = i18n.t('fileInfo.file');
```

### 3. 在 HTML 中更新文本

```javascript
// 等待国际化加载完成
document.addEventListener('DOMContentLoaded', async () => {
  await i18n.loadLocale(i18n.currentLocale);

  // 更新界面文本
  document.querySelector('#fileName').previousElementSibling.textContent =
    i18n.t('fileInfo.file');
});
```

### 4. 监听语言切换事件

```javascript
window.addEventListener('localeChanged', (event) => {
  const locale = event.detail.locale;
  console.log('Language changed to:', locale);
  updateUIText();
});

function updateUIText() {
  // 重新获取所有翻译文本并更新界面
}
```

## 添加新的翻译

### 1. 在 messages.json 中添加键

所有语言文件都需要添加相同的键：

**en/messages.json**:
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

**zh_CN/messages.json**:
```json
{
  "newFeature": {
    "title": "新功能",
    "description": "这是一个新功能"
  }
}
```

### 2. 在代码中使用

```javascript
const title = i18n.t('newFeature.title');
const description = i18n.t('newFeature.description');
```

## 命名规范

翻译键使用以下规范：
- 使用小驼峰命名法
- 使用点号分隔层级
- 按功能模块组织
- 键名要有描述性

示例：
```
viewer.title
fileInfo.file
tabs.stateMachine
controls.background
shortcuts.playPause
```

## 当前翻译覆盖

### 已翻译的模块

- ✅ 查看器标题和元信息
- ✅ 文件信息面板
- ✅ 标签页（状态机、时间线）
- ✅ 背景控制
- ✅ 快捷键帮助
- ✅ 性能监控
- ✅ 速度控制

### 待翻译的模块

- ⏳ Data Binding UI 文本
- ⏳ 状态机输入控件
- ⏳ 动画列表
- ⏳ 缩放控制提示文本

## 添加新语言

1. 在 `_locales/` 下创建新的语言目录（如 `zh_TW`）
2. 复制 `messages.json` 并翻译所有键值
3. 在 `scripts/i18n.js` 中添加语言加载逻辑（如需要）
4. 测试新语言

## 常见问题

### Q: 翻译文本未显示？

A: 确保：
1. 已引入 `i18n.js` 脚本
2. 等待 `loadLocale()` 完成后再获取文本
3. 翻译键在所有语言文件中都存在

### Q: 如何动态切换语言？

A: 使用 `i18n.setLocale()` 方法：

```javascript
await i18n.setLocale('en');
```

### Q: 缺失的翻译如何处理？

A: 当翻译键不存在时，`i18n.t()` 会返回键本身作为后备，并在控制台输出警告。

## 最佳实践

1. **尽早加载国际化**：在页面加载时立即调用 `loadLocale()`
2. **使用常量**：将常用的翻译键定义为常量，避免拼写错误
3. **保持同步**：添加新功能时，同时更新所有语言文件
4. **测试所有语言**：发布前测试所有支持的语言
5. **提供上下文**：在键名中包含足够的上下文信息

## 示例代码

### 完整示例：更新文件信息面板

```javascript
function updateFileInfoPanel() {
  const fileInfo = document.getElementById('fileInfo');

  // 更新标签
  fileInfo.querySelector('[data-i18n="fileInfo.file"]').textContent =
    i18n.t('fileInfo.file');
  fileInfo.querySelector('[data-i18n="fileInfo.size"]').textContent =
    i18n.t('fileInfo.size');

  // 或者使用 data 属性自动更新
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n.t(key);
  });
}

// 监听语言切换
window.addEventListener('localeChanged', updateFileInfoPanel);

// 初始加载
document.addEventListener('DOMContentLoaded', async () => {
  await i18n.loadLocale(i18n.currentLocale);
  updateFileInfoPanel();
});
```

## 贡献指南

欢迎贡献新的翻译或改进现有翻译！

1. Fork 本仓库
2. 修改相应的 `messages.json` 文件
3. 提交 Pull Request

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-26

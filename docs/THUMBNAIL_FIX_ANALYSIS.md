# 缩略图生成问题分析与修复方案

## 问题对比：最后一次工作版本 vs 当前版本

### 最后工作版本 (commit 24cb97d)

**loadRiveRuntime 函数**:
```javascript
function loadRiveRuntime() {
    if (typeof window !== 'undefined' && window.rive) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = RIVE_LOCAL;  // ✅ 直接使用文件路径
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load Rive runtime'));
        document.head.appendChild(s);
    });
}
```

**WebGL2 上下文处理**:
```javascript
// ✅ 不预创建 WebGL2 上下文，使用拦截方式
const origGetContext = canvas.getContext.bind(canvas);
canvas.getContext = function(type, attrs) {
    if (type === 'webgl2' || type === 'webgl') {
        attrs = Object.assign({}, attrs || {}, {
            preserveDrawingBuffer: true,
            antialias: true,
        });
    }
    return origGetContext(type, attrs);
};
// 没有调用 canvas.getContext('webgl2', ...)
```

**Rive 实例配置**:
```javascript
inst = new rive.Rive({
    buffer: arrayBuffer,
    canvas: canvas,
    autoplay: false,
    autoBind: true,              // ✅ 重要！
    shouldDisableRiveListeners: true,
    enableRiveAssetCDN: false,   // ✅ 重要！
    layout: new rive.Layout({...}),
});
```

**播放逻辑**:
```javascript
// ✅ 先调用 play() 让 autoBind 完全应用
inst.play();

requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        const sms = inst.stateMachineNames || [];
        const anims = inst.animationNames || [];
        if (sms.length > 0) {
            inst.stop();
            inst.play(sms[0]);
        } else if (anims.length > 0) {
            inst.stop();
            inst.play(anims[0]);
        }
        // ... 等待30帧后截图
    });
});
```

### 当前版本（有问题）

**loadRiveRuntime 函数**:
```javascript
function loadRiveRuntime() {
    // ❌ 使用 pathToFileURL
    s.src = pathToFileURL(RIVE_LOCAL).href;
    s.onload = () => {
        // ❌ 调用 setWasmUrl
        if (window.rive && window.rive.RuntimeLoader) {
            window.rive.RuntimeLoader.setWasmUrl(WASM_URL);
        }
        resolve();
    };
}
```

**WebGL2 上下文处理**:
```javascript
// ❌ 预创建 WebGL2 上下文
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: true });
// 没有使用拦截方式
```

**Rive 实例配置**:
```javascript
inst = new rive.Rive({
    buffer: arrayBuffer,
    canvas: canvas,
    autoplay: false,
    shouldDisableRiveListeners: true,
    // ❌ 缺少 autoBind: true
    // ❌ 缺少 enableRiveAssetCDN: false
    layout: new rive.Layout({...}),
});
```

**播放逻辑**:
```javascript
// ❌ 直接播放，没有先调用 play()
const sms = inst.stateMachineNames || [];
if (sms.length > 0) {
    inst.play(sms[0]);
}
// ... 等待10帧后截图
```

---

## 关键问题

### 1. 预创建 WebGL2 上下文
- **问题**: 当前版本预创建了 WebGL2 上下文 (`canvas.getContext('webgl2', ...)`)
- **后果**: Rive 渲染器无法正确配置所需的 WebGL 扩展（羽化、模糊、圆角等）
- **正确方式**: 使用拦截方式，让 Rive 自行创建上下文

### 2. 缺少 autoBind: true
- **问题**: 当前版本没有设置 `autoBind: true`
- **后果**: Data Binding 的初始值可能不正确
- **正确方式**: 必须设置 `autoBind: true`

### 3. 缺少 enableRiveAssetCDN: false
- **问题**: 当前版本没有设置 `enableRiveAssetCDN: false`
- **后果**: 可能尝试从 CDN 加载字体等资源，导致加载失败
- **正确方式**: 必须设置 `enableRiveAssetCDN: false`

### 4. 播放逻辑不同
- **问题**: 当前版本直接播放状态机，没有先调用 `play()`
- **后果**: 可能导致初始化不完整
- **正确方式**: 先调用 `inst.play()` 让 autoBind 完全应用

### 5. 复杂的 WASM URL 设置
- **问题**: 使用 `pathToFileURL` 和 `setWasmUrl`
- **后果**: 可能导致 WASM 文件加载失败
- **正确方式**: 不需要特殊设置，Rive 会自动从相对路径加载

### 6. 等待帧数减少
- **问题**: 从 30 帧减少到 10 帧
- **后果**: 复杂效果可能没有完全渲染
- **正确方式**: 保持 30 帧等待

---

## 修复方案

恢复到最后工作版本 (commit 24cb97d) 的实现方式，保持 WASM 文件在同一目录的正确结构。

### 步骤

1. 恢复 `loadRiveRuntime` 函数
2. 恢复 WebGL2 上下文拦截方式（不预创建）
3. 恢复 Rive 实例配置（添加 `autoBind` 和 `enableRiveAssetCDN`）
4. 恢复播放逻辑（先调用 `play()`）
5. 恢复等待帧数到 30
6. 移除不必要的 WASM URL 设置

### 文件结构

```
viewer/lib/
├── rive.webgl2.js  (294KB JavaScript)
└── rive.wasm       (2.1MB WebAssembly)
```

Rive 会自动从相对路径加载 `rive.wasm`（与 rive.webgl2.js 同目录）。

---

## 为什么之前的工作方式有效

1. **拦截方式**: 让 Rive 渲染器自行创建 WebGL2 上下文，确保所有扩展正确启用
2. **autoBind**: 确保 Data Binding 初始值正确应用
3. **enableRiveAssetCDN**: 强制使用本地资源，不尝试 CDN
4. **双重 rAF**: 确保 autoBind 完全应用后再播放状态机
5. **30 帧等待**: 给予足够时间让复杂效果完全渲染

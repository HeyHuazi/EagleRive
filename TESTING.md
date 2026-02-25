# 测试文档

本文档详细说明 Eagle Rive 插件的测试策略、测试覆盖率和如何编写测试。

## 📋 目录

- [测试概览](#测试概览)
- [测试环境](#测试环境)
- [运行测试](#运行测试)
- [测试结构](#测试结构)
- [编写测试](#编写测试)
- [测试覆盖率](#测试覆盖率)
- [CI/CD 集成](#cicd-集成)
- [故障排除](#故障排除)

## 🎯 测试概览

### 测试统计

| 指标 | 数值 |
|------|------|
| 总测试数 | 85+ |
| 通过率 | 100% |
| 代码覆盖率 | 86.48% (utils.js) |
| 测试框架 | Jest + jsdom |

### 测试类型

1. **单元测试** - 测试单个模块功能
2. **集成测试** - 测试模块间交互（规划中）
3. **E2E 测试** - 端到端用户场景（规划中）

## 🛠️ 测试环境

### 技术栈

- **测试框架**: Jest 29.7.0
- **测试环境**: jsdom（模拟浏览器 DOM）
- **覆盖率工具**: Jest 内置覆盖率报告

### package.json 配置

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "js/**/*.js",
      "viewer/js/**/*.js",
      "thumbnail/**/*.js",
      "!**/node_modules/**"
    ],
    "testMatch": [
      "**/tests/**/*.test.js"
    ],
    "setupFilesAfterEnv": [
      "<rootDir>/tests/setup.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 50,
        "functions": 50,
        "lines": 50,
        "statements": 50
      }
    }
  }
}
```

### 全局设置（tests/setup.js）

```javascript
// 1. Mock console 方法
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
};

// 2. Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// 3. 设置全局 window 对象
if (typeof global.window === 'undefined') {
    global.window = global;
}

// 4. 加载工具模块
const utils = require('../viewer/js/utils.js');
global.RiveUtils = utils.RiveUtils;
global.normalizeType = utils.normalizeType;

// 5. 模块加载辅助函数
global.loadModule = function(moduleName) {
    const fs = require('fs');
    const path = require('path');
    const modulesDir = path.resolve(__dirname, '../viewer/js');
    const filePath = path.join(modulesDir, moduleName);
    const code = fs.readFileSync(filePath, 'utf8');
    eval(code);
};
```

## 🚀 运行测试

### 命令

```bash
# 运行所有测试
npm test

# 监视模式（文件修改自动重新运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- animation.test.js

# 运行匹配模式的测试
npm test -- --testNamePattern="应该正确播放动画"
```

### 输出示例

```bash
$ npm test

PASS  tests/unit/animation.test.js
PASS  tests/unit/playback.test.js
PASS  tests/unit/zoom.test.js
...

Suites:   8 passed, 8 total
Tests:    85 passed, 85 total
Snapshots:   0 total
Time:     2.456s
```

## 📁 测试结构

```
tests/
├── setup.js              # Jest 全局设置
├── unit/                 # 单元测试
│   ├── animation.test.js
│   ├── app.test.js
│   ├── data-binding.test.js
│   ├── playback.test.js
│   ├── state-machine.test.js
│   ├── ui.test.js
│   ├── utils.test.js
│   └── zoom.test.js
├── integration/          # 集成测试（规划中）
└── fixtures/             # 测试数据和 Mock
```

## ✍️ 编写测试

### 基础测试模板

```javascript
describe('ModuleName', () => {
    // 每个测试前执行
    beforeEach(() => {
        // 准备测试环境
        document.body.innerHTML = '<div id="test-element"></div>';
        loadModule('moduleName.js');
    });

    // 每个测试后执行
    afterEach(() => {
        // 清理
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('公共方法', () => {
        it('应该正确处理正常输入', () => {
            // Arrange（准备）
            const input = 'test';

            // Act（执行）
            const result = window.ModuleName.method(input);

            // Assert（断言）
            expect(result).toBe('expected');
        });

        it('应该处理边界情况', () => {
            expect(window.ModuleName.method(null)).toBe(null);
            expect(window.ModuleName.method('')).toBe('');
        });

        it('应该优雅处理错误', () => {
            expect(() => {
                window.ModuleName.method(invalidInput);
            }).not.toThrow();
        });
    });
});
```

### 测试示例

#### 1. 测试 DOM 操作

```javascript
describe('Zoom Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="canvasContainer">
                <canvas id="riveCanvas"></canvas>
            </div>
            <button id="zoomIn">+</button>
            <button id="zoomOut">-</button>
        `;
        loadModule('zoom.js');
        window.Zoom.bindEvents();
    });

    it('应该放大画布', () => {
        const initialScale = window.Zoom.getScale();
        window.Zoom.zoomIn();
        const newScale = window.Zoom.getScale();
        expect(newScale).toBeGreaterThan(initialScale);
    });

    it('应该正确应用 CSS transform', () => {
        window.Zoom.zoomIn();
        const canvas = document.getElementById('riveCanvas');
        expect(canvas.style.transform).toContain('scale(');
    });
});
```

#### 2. 测试异步操作

```javascript
describe('Animation Module', () => {
    it('应该异步加载动画', async () => {
        const mockRive = {
            play: jest.fn(),
            on: jest.fn()
        };

        await window.Animation.playAnim(mockRive, 'testAnimation');

        expect(mockRive.play).toHaveBeenCalledWith('testAnimation');
    });
});
```

#### 3. 测试事件触发

```javascript
describe('Playback Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="playBtn">播放</button>
        `;
        window.Playback.bindEvents(null);
    });

    it('应该切换播放状态', () => {
        const playBtn = document.getElementById('playBtn');
        const initialState = window.Playback.getPlaying();

        playBtn.click();

        const newState = window.Playback.getPlaying();
        expect(newState).toBe(!initialState);
    });
});
```

#### 4. Mock 外部依赖

```javascript
describe('App Module', () => {
    it('应该正确初始化 Rive 实例', () => {
        // Mock Rive 构造函数
        const mockRive = jest.fn(() => ({
            play: jest.fn(),
            on: jest.fn()
        }));
        global.rive = { Rive: mockRive };

        loadModule('app.js');

        // 验证 Rive 被正确调用
        expect(mockRive).toHaveBeenCalled();
    });
});
```

### 最佳实践

#### 1. 测试命名

使用清晰的描述性名称：

```javascript
// ✅ 好
it('应该正确播放动画', () => {});
it('应该在 Rive 实例为 null 时返回 false', () => {});

// ❌ 差
it('测试播放', () => {});
it('测试 null', () => {});
```

#### 2. AAA 模式

使用 Arrange-Act-Assert 模式：

```javascript
it('应该正确设置速度', () => {
    // Arrange（准备）
    const speed = 2.0;

    // Act（执行）
    window.Playback.setSpeed(speed);

    // Assert（断言）
    expect(window.Playback.getSpeed()).toBe(2.0);
});
```

#### 3. 一个测试一个断言

```javascript
// ✅ 好
it('应该返回正确的缩放比例', () => {
    expect(window.Zoom.getScale()).toBe(1.0);
});

it('应该返回正确的偏移量', () => {
    expect(window.Zoom.getOffset()).toEqual({ x: 0, y: 0 });
});

// ❌ 差
it('应该返回正确的状态', () => {
    expect(window.Zoom.getScale()).toBe(1.0);
    expect(window.Zoom.getOffset()).toEqual({ x: 0, y: 0 });
    expect(window.Zoom.isZoomed()).toBe(false);
});
```

#### 4. 测试边界情况

```javascript
describe('normalizeType', () => {
    it('应该处理数字类型', () => {
        expect(normalizeType('number')).toBe('number');
        expect(normalizeType(1)).toBe('number');
    });

    it('应该处理未知类型', () => {
        expect(normalizeType('unknown')).toBe('unknown');
        expect(normalizeType(999)).toBe(999);
    });

    it('应该处理 null 和 undefined', () => {
        expect(normalizeType(null)).toBe(null);
        expect(normalizeType(undefined)).toBe(undefined);
    });
});
```

## 📊 测试覆盖率

### 当前覆盖率

| 模块 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 | 语句覆盖率 |
|------|-----------|-----------|----------|-----------|
| utils.js | 85.71% | 100% | 92.5% | 93.67% |
| animation.js | - | - | - | - |
| playback.js | - | - | - | - |
| zoom.js | - | - | - | - |
| **全局目标** | **50%** | **50%** | **50%** | **50%** |

### 查看覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 报告位置
open coverage/lcov-report/index.html
```

### 提高覆盖率

#### 1. 识别未覆盖的代码

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看未覆盖的行
cat coverage/lcov.info | grep "end_of_record"
```

#### 2. 添加测试用例

```javascript
// 未覆盖的代码
function handleError(error) {
    if (error.code === 'FILE_NOT_FOUND') {
        return '文件未找到';
    } else if (error.code === 'NETWORK_ERROR') {
        return '网络错误';
    }
    return '未知错误';
}

// 添加测试
describe('handleError', () => {
    it('应该处理 FILE_NOT_FOUND', () => {
        const result = handleError({ code: 'FILE_NOT_FOUND' });
        expect(result).toBe('文件未找到');
    });

    it('应该处理 NETWORK_ERROR', () => {
        const result = handleError({ code: 'NETWORK_ERROR' });
        expect(result).toBe('网络错误');
    });

    it('应该处理未知错误', () => {
        const result = handleError({ code: 'UNKNOWN' });
        expect(result).toBe('未知错误');
    });
});
```

## 🔄 CI/CD 集成

### GitHub Actions（规划中）

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test

    - name: Generate coverage
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## 🔧 故障排除

### 常见问题

#### 1. 测试失败：DOM 元素未找到

**错误**：
```
Error: Cannot read property 'addEventListener' of null
```

**解决**：
```javascript
beforeEach(() => {
    // 确保 DOM 已设置
    document.body.innerHTML = '<div id="my-element"></div>';
    loadModule('myModule.js');
});
```

#### 2. 模块未定义

**错误**：
```
ReferenceError: window.ModuleName is not defined
```

**解决**：
```javascript
beforeEach(() => {
    loadModule('moduleName.js');
    // 确保模块加载后再测试
});
```

#### 3. Mock 不生效

**错误**：
```javascript
jest.fn() 被真实实现替换
```

**解决**：
```javascript
// 在加载模块前设置 Mock
global.rive = {
    Rive: jest.fn(() => mockInstance)
};

loadModule('app.js');
```

#### 4. 异步测试超时

**错误**：
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**解决**：
```javascript
it('应该异步加载数据', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
}, 10000); // 增加超时时间
```

### 调试技巧

#### 1. 使用调试语句

```javascript
it('应该正确处理', () => {
    console.log('当前状态:', window.ModuleName.getState());
    // ...
});
```

#### 2. 只运行特定测试

```bash
# 只运行一个测试
npm test -- -t "应该正确播放动画"

# 只运行一个文件
npm test -- animation.test.js
```

#### 3. 查看详细输出

```bash
# 详细输出
npm test -- --verbose

# 显示 console.log
npm test -- --no-coverage
```

## 📚 相关资源

### Jest 文档

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [Jest DOM 匹配器](https://jestjs.io/docs/expect)
- [Jest Mock 函数](https://jestjs.io/docs/mock-functions)

### 测试最佳实践

- [JavaScript 测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [单元测试原则](https://martinfowler.com/bliki/UnitTest.html)

## 🎯 测试目标

### 短期目标

- [ ] 所有模块覆盖率达到 80%
- [ ] 添加集成测试
- [ ] 设置 CI/CD 流程

### 长期目标

- [ ] E2E 测试覆盖核心用户流程
- [ ] 性能测试
- [ ] 可访问性测试

---

## 贡献测试

欢迎贡献测试！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细流程。

### 测试贡献清单

提交测试 PR 前，请确保：

- [ ] 所有测试通过（`npm test`）
- [ ] 覆盖率未降低（`npm run test:coverage`）
- [ ] 代码检查通过（`npm run lint`）
- [ ] 添加了必要的注释
- [ ] 遵循测试最佳实践

---

最后更新：2026-02-25

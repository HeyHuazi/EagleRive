/**
 * 国际化（i18n）辅助模块
 *
 * 用法：
 * 1. 在 HTML 中引入此脚本
 * 2. 使用 i18n.getMessage('key') 获取翻译文本
 * 3. 使用 i18n.t('key') 作为简写
 */

(function(window) {
    'use strict';

    /**
   * 国际化类
   */
    class I18n {
        constructor() {
            this.messages = {};
            this.currentLocale = 'zh_CN'; // 默认中文
            this.locales = {};
            this.isReady = false;
            this.pendingCallbacks = [];
        }

        /**
     * 初始化国际化
     * @param {string} defaultLocale - 默认语言代码
     */
        async init(defaultLocale = 'zh_CN') {
            this.currentLocale = defaultLocale;
            await this.loadLocale(this.currentLocale);
        }

        /**
     * 加载指定语言的翻译文件
     * @param {string} locale - 语言代码（如 'en', 'zh_CN'）
     */
        async loadLocale(locale) {
            try {
                // 尝试多个可能的路径
                const possiblePaths = [
                    `../_locales/${locale}/messages.json`,
                    `../../_locales/${locale}/messages.json`,
                    `./_locales/${locale}/messages.json`,
                    `_locales/${locale}/messages.json`,
                ];

                let response = null;
                let loadedPath = '';

                for (const path of possiblePaths) {
                    try {
                        response = await fetch(path);
                        if (response.ok) {
                            loadedPath = path;
                            break;
                        }
                    } catch (e) {
                        // 继续尝试下一个路径
                    }
                }

                if (!response || !response.ok) 
                    throw new Error(`Failed to load locale: ${locale} (tried all paths)`);
        

                console.log(`[i18n] Loaded locale: ${locale} from ${loadedPath}`);
                this.locales[locale] = await response.json();
                this.messages = this.locales[locale];
                this.isReady = true;

                // 执行等待中的回调
                this.pendingCallbacks.forEach((cb) => cb());
                this.pendingCallbacks = [];
            } catch (error) {
                console.warn(`[i18n] Failed to load locale ${locale}:`, error);
                // 回退到默认语言
                if (locale !== 'zh_CN') 
                    await this.loadLocale('zh_CN');
                else {
                    // 即使加载失败也标记为就绪，使用键本身作为文本
                    this.isReady = true;
                    this.pendingCallbacks.forEach((cb) => cb());
                    this.pendingCallbacks = [];
                }
            }
        }

        /**
     * 获取翻译文本
     * @param {string} key - 翻译键（使用点号分隔，如 'fileInfo.file'）
     * @param {string[]} _params - 参数（暂不支持）
     * @returns {string} 翻译后的文本
     */
        getMessage(key, _params) {
            const keys = key.split('.');
            let value = this.messages;

            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) 
                    value = value[k];
                else {
                    console.warn(`[i18n] Missing translation key: ${key}`);
                    return key; // 返回键本身作为后备
                }
            }

            return typeof value === 'string' ? value : key;
        }

        /**
     * 简写方法
     */
        t(key, params) {
            return this.getMessage(key, params);
        }

        /**
     * 当翻译准备好后执行回调
     */
        onReady(callback) {
            if (this.isReady) 
                callback();
            else 
                this.pendingCallbacks.push(callback);
      
        }

        /**
     * 切换语言
     * @param {string} locale - 语言代码
     */
        async setLocale(locale) {
            if (locale in this.locales) {
                this.messages = this.locales[locale];
                this.currentLocale = locale;
                this.updateUIText();
            } else {
                await this.loadLocale(locale);
                this.currentLocale = locale;
                this.updateUIText();
            }
        }

        /**
     * 更新界面文本（需要在实现中调用）
     * 子类可以重写此方法来更新界面
     */
        updateUIText() {
            // 触发自定义事件，让其他模块知道语言已更改
            window.dispatchEvent(
                new CustomEvent('localeChanged', {
                    detail: { locale: this.currentLocale },
                })
            );
        }
    }

    // 创建全局实例
    window.i18n = new I18n();

    // 自动初始化（检测 Eagle 语言设置）
    // 注意：Format Extension viewer 中的 window.eagle API 可能不可用
    async function initializeI18n() {
        let detectedLocale = 'zh_CN'; // 默认值

        // 调试信息：输出可用的全局对象
        console.log('[i18n] Debug - window.eagle:', typeof window.eagle);
        console.log('[i18n] Debug - navigator.language:', navigator.language);

        // 优先级顺序：
        // 1. Eagle API (window.eagle.app.locale) - 如果可用
        // 2. URL 参数 (lang 或 locale)
        // 3. 浏览器语言 (navigator.language)
        // 4. 默认中文

        try {
            // 检查 Eagle API
            if (typeof window !== 'undefined' && window.eagle?.app?.locale) {
                detectedLocale = window.eagle.app.locale;
                console.log('[i18n] ✓ Using Eagle locale:', detectedLocale);
            }
            // 检查 URL 参数
            else if (typeof window !== 'undefined' && window.location?.search) {
                const urlParams = new URLSearchParams(window.location.search);
                const langParam = urlParams.get('lang') || urlParams.get('locale');
                if (langParam) {
                    detectedLocale = langParam;
                    console.log('[i18n] ✓ Using URL parameter:', detectedLocale);
                } else {
                    // 使用浏览器语言
                    detectedLocale = navigator.language || 'zh_CN';
                    console.log('[i18n] ✓ Using browser language:', detectedLocale);
                }
            }
            // 使用浏览器语言
            else {
                detectedLocale = navigator.language || 'zh_CN';
                console.log('[i18n] ✓ Using browser language:', detectedLocale);
            }
        } catch (e) {
            console.warn('[i18n] Error detecting locale:', e);
            detectedLocale = 'zh_CN';
        }

        const normalizedLocale = detectedLocale.replace('-', '_');

        // 支持的语言映射
        const supportedLocales = ['en', 'zh_CN'];
        const finalLocale =
      supportedLocales.includes(normalizedLocale) ||
      supportedLocales.includes(normalizedLocale.split('_')[0])
          ? normalizedLocale.startsWith('zh')
              ? 'zh_CN'
              : 'en'
          : 'zh_CN';

        console.log('[i18n] Initializing with locale:', finalLocale);
        await window.i18n.init(finalLocale);
        console.log('[i18n] Initialization complete');
    }

    // 立即执行初始化
    initializeI18n();
})(window);

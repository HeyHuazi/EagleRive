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
    }

    /**
     * 初始化国际化
     * @param {string} defaultLocale - 默认语言代码
     */
    init(defaultLocale = 'zh_CN') {
      this.currentLocale = defaultLocale;
      this.loadLocale(this.currentLocale);
    }

    /**
     * 加载指定语言的翻译文件
     * @param {string} locale - 语言代码（如 'en', 'zh_CN'）
     */
    async loadLocale(locale) {
      try {
        const response = await fetch(`../../_locales/${locale}/messages.json`);
        if (!response.ok) {
          throw new Error(`Failed to load locale: ${locale}`);
        }
        this.locales[locale] = await response.json();
        this.messages = this.locales[locale];
        console.log(`[i18n] Loaded locale: ${locale}`);
      } catch (error) {
        console.warn(`[i18n] Failed to load locale ${locale}:`, error);
        // 回退到默认语言
        if (locale !== 'zh_CN') {
          this.loadLocale('zh_CN');
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
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
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
      window.dispatchEvent(new CustomEvent('localeChanged', {
        detail: { locale: this.currentLocale }
      }));
    }
  }

  // 创建全局实例
  window.i18n = new I18n();

  // 自动初始化（检测 Eagle 语言设置）
  // Eagle 插件环境中可能需要通过其他方式获取语言设置
  const eagleLocale = window.eagle?.locale || navigator.language || 'zh_CN';
  const normalizedLocale = eagleLocale.replace('-', '_');
  window.i18n.init(normalizedLocale);

})(window);

/**
 * 国际化 UI 更新模块
 *
 * 自动更新带有 data-i18n 和 data-i18n-title 属性的元素
 */

(function() {
    'use strict';

    /**
   * 更新所有带有 data-i18n 属性的元素
   */
    function updateAllElements() {
    // 更新带有 data-i18n 属性的元素的文本内容
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (key && window.i18n) {
                const translation = window.i18n.t(key);
                if (translation !== key) {
                    // 如果是 input 或 textarea，更新 placeholder
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') 
                        el.placeholder = translation;
                    else 
                        el.textContent = translation;
          
                }
            }
        });

        // 更新带有 data-i18n-title 属性的元素的 title
        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.getAttribute('data-i18n-title');
            if (key && window.i18n) {
                const translation = window.i18n.t(key);
                if (translation !== key) 
                    el.title = translation;
        
            }
        });

        // 更新带有 data-i18n-placeholder 属性的元素的 placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key && window.i18n) {
                const translation = window.i18n.t(key);
                if (translation !== key) 
                    el.placeholder = translation;
        
            }
        });
    }

    /**
   * 等待 i18n 准备好后更新 UI
   */
    if (window.i18n && window.i18n.isReady) {
    // i18n 已经准备好，立即更新
        updateAllElements();
    } else if (window.i18n) {
    // 等待 i18n 准备好
        window.i18n.onReady(updateAllElements);
    } else {
    // i18n 还未加载，等待 DOMContentLoaded 后检查
        document.addEventListener('DOMContentLoaded', () => {
            if (window.i18n) {
                if (window.i18n.isReady) 
                    updateAllElements();
                else 
                    window.i18n.onReady(updateAllElements);
        
            }
        });
    }

    // 监听语言变更事件
    window.addEventListener('localeChanged', () => {
        updateAllElements();
        // 通知其他模块更新文本
        if (window.UI && window.UI.updateLocaleText) 
            window.UI.updateLocaleText();
    
    });

    // 暴露更新函数供其他模块调用
    if (!window.I18nUI) {
        window.I18nUI = {
            update: updateAllElements,
        };
    }
})();

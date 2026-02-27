/**
 * Shortcuts help panel module
 */

(function() {
    'use strict';

    // Shortcuts configuration (with translation keys)
    const SHORTCUTS = [
        { keyKey: 'shortcuts.keys.resetZoom', descKey: 'shortcuts.desc.resetZoom' },
        { keyKey: 'shortcuts.keys.zoomIn', descKey: 'shortcuts.desc.zoomIn' },
        { keyKey: 'shortcuts.keys.zoomOut', descKey: 'shortcuts.desc.zoomOut' },
        { keyKey: 'shortcuts.keys.pan', descKey: 'shortcuts.desc.pan' },
        { keyKey: 'shortcuts.keys.scrollZoom', descKey: 'shortcuts.desc.scrollZoom' }
    ];

    let panel = null;
    let helpButton = null;

    /**
     * Get translated shortcuts list
     */
    function getTranslatedShortcuts() {
        return SHORTCUTS.map(s => ({
            key: window.i18n ? window.i18n.t(s.keyKey) : s.keyKey,
            desc: window.i18n ? window.i18n.t(s.descKey) : s.descKey
        }));
    }

    /**
     * Create shortcuts panel element
     */
    function createPanel() {
        const div = document.createElement('div');
        div.className = 'shortcuts-panel';

        const translatedShortcuts = getTranslatedShortcuts();
        const panelTitle = window.i18n ? window.i18n.t('shortcuts.panel') : '快捷键';
        const closeTitle = window.i18n ? window.i18n.t('shortcuts.close') : '关闭';

        div.innerHTML = `
            <div class="shortcuts-overlay" id="shortcutsOverlay"></div>
            <div class="shortcuts-content">
                <div class="shortcuts-header">
                    <h3>${panelTitle}</h3>
                    <button class="shortcuts-close" id="shortcutsClose" title="${closeTitle}">×</button>
                </div>
                <ul class="shortcuts-list">
                    ${translatedShortcuts.map(s => `
                        <li>
                            <kbd>${s.key}</kbd>
                            <span>${s.desc}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        // Setup close handlers
        const overlay = div.querySelector('#shortcutsOverlay');
        const closeBtn = div.querySelector('#shortcutsClose');

        const close = () => hidePanel();
        overlay.addEventListener('click', close);
        closeBtn.addEventListener('click', close);

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return div;
    }

    /**
     * Show shortcuts panel
     */
    function showPanel() {
        if (!panel) 
            panel = createPanel();
        

        document.body.appendChild(panel);
        // Trigger reflow for animation
        panel.offsetHeight;
        panel.classList.add('visible');
    }

    /**
     * Hide shortcuts panel
     */
    function hidePanel() {
        if (panel) {
            panel.classList.remove('visible');
            setTimeout(() => {
                if (panel && panel.parentNode) 
                    panel.parentNode.removeChild(panel);
                
            }, 300);
        }
    }

    /**
     * Toggle shortcuts panel visibility
     */
    function togglePanel() {
        if (panel && panel.parentNode) 
            hidePanel();
        else 
            showPanel();
        
    }

    /**
     * Update help button title
     */
    function updateHelpButtonTitle() {
        if (helpButton) {
            const helpTitle = window.i18n ? window.i18n.t('shortcuts.help') : '快捷键帮助';
            helpButton.title = helpTitle;
        }
    }

    /**
     * Initialize shortcuts help button
     */
    function initShortcutsButton() {
        // Find the right side controls container
        const controlsRight = document.querySelector('.controls-right');
        if (!controlsRight) {
            console.warn('[Shortcuts] Controls right container not found');
            return;
        }

        // Create help button
        const btn = document.createElement('button');
        btn.className = 'help-btn';
        btn.id = 'shortcutsHelpBtn';
        const helpTitle = window.i18n ? window.i18n.t('shortcuts.help') : '快捷键帮助';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/></svg>';
        btn.title = helpTitle;
        btn.onclick = togglePanel;

        // Add to right side controls
        controlsRight.appendChild(btn);
        helpButton = btn;
    }

    /**
     * Update locale text (called when language changes)
     */
    function updateLocaleText() {
        updateHelpButtonTitle();
        // Recreate panel on next show to use new language
        if (panel) {
            panel.remove();
            panel = null;
        }
    }

    // Listen for locale changes
    window.addEventListener('localeChanged', updateLocaleText);

    // Expose public API
    window.Shortcuts = {
        show: showPanel,
        hide: hidePanel,
        toggle: togglePanel,
        init: initShortcutsButton,
        updateLocaleText: updateLocaleText
    };
})();

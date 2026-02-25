/**
 * Shortcuts help panel module
 */

(function() {
    'use strict';

    // Shortcuts configuration
    const SHORTCUTS = [
        { key: 'Ctrl+0', desc: '重置缩放' },
        { key: 'Ctrl++', desc: '放大' },
        { key: 'Ctrl+-', desc: '缩小' },
        { key: '按住 Space + 拖动', desc: '平移画布' },
        { key: 'Ctrl + 滚轮', desc: '缩放' }
    ];

    let panel = null;

    /**
     * Create shortcuts panel element
     */
    function createPanel() {
        const div = document.createElement('div');
        div.className = 'shortcuts-panel';
        div.innerHTML = `
            <div class="shortcuts-overlay" id="shortcutsOverlay"></div>
            <div class="shortcuts-content">
                <div class="shortcuts-header">
                    <h3>快捷键</h3>
                    <button class="shortcuts-close" id="shortcutsClose" title="关闭">×</button>
                </div>
                <ul class="shortcuts-list">
                    ${SHORTCUTS.map(s => `
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
        if (!panel) {
            panel = createPanel();
        }

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
                if (panel && panel.parentNode) {
                    panel.parentNode.removeChild(panel);
                }
            }, 300);
        }
    }

    /**
     * Toggle shortcuts panel visibility
     */
    function togglePanel() {
        if (panel && panel.parentNode) {
            hidePanel();
        } else {
            showPanel();
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
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/></svg>';
        btn.title = '快捷键帮助';
        btn.onclick = togglePanel;

        // Add to right side controls
        controlsRight.appendChild(btn);
    }

    // Expose public API
    window.Shortcuts = {
        show: showPanel,
        hide: hidePanel,
        toggle: togglePanel,
        init: initShortcutsButton
    };
})();

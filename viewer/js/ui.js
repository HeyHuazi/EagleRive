/**
 * UI module for Rive viewer
 */

const UI = (function() {
    /**
     * Setup tab switching
     */
    function setupTabs(riveInstance) {
        document.querySelectorAll('.sidebar-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.sidebar-tab').forEach(function(t) { t.classList.remove('active'); });
                document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });

                tab.classList.add('active');
                document.getElementById('panel-' + tab.dataset.tab).classList.add('active');

                // Switch to appropriate playback mode
                const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
                const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

                if (tab.dataset.tab === 'statemachine' && curSM) {
                    if (window.stateMachineModule) {
                        window.stateMachineModule.playSM(riveInstance, curSM);
                    }
                } else if (tab.dataset.tab === 'timeline' && curAnim) {
                    if (window.animationModule) {
                        window.animationModule.playAnim(riveInstance, curAnim);
                    }
                }
            });
        });
    }

    /**
     * Setup background swatches
     */
    function setupBackgroundSwatches() {
        const container = document.getElementById('canvasContainer');

        document.querySelectorAll('.bg-swatch').forEach(function(swatch) {
            swatch.addEventListener('click', function() {
                document.querySelectorAll('.bg-swatch').forEach(function(s) { s.classList.remove('active'); });
                swatch.classList.add('active');

                container.className = 'canvas-container';
                const bg = swatch.dataset.bg;

                if (bg === 'checker') {
                    container.classList.add('bg-checker');
                } else if (bg === 'white') {
                    container.classList.add('bg-white');
                } else if (bg === 'black') {
                    container.classList.add('bg-black');
                }
            });
        });
    }

    /**
     * Setup artboard switching
     */
    function setupArtboardSwitch(riveInstance) {
        const abs = riveInstance.artboardNames || [];

        if (abs.length > 1) {
            document.getElementById('artboardRow').style.display = '';
            const sel = document.getElementById('artboardSelect');

            sel.innerHTML = abs.map(a => '<option value="' + a + '">' + a + '</option>').join('');

            sel.addEventListener('change', function() {
                switchArtboard(riveInstance, sel.value);
            });
        }
    }

    /**
     * Switch artboard
     */
    function switchArtboard(riveInstance, name) {
        const filePath = window.currentFilePath;

        if (riveInstance) riveInstance.cleanup();

        // Reset current SM and anim
        if (window.stateMachineModule) {
            window.stateMachineModule.setCurrentSM(null);
        }
        if (window.animationModule) {
            window.animationModule.setCurrentAnim(null);
        }

        const defaultLayout = new rive.Layout({
            fit: rive.Fit.Contain,
            alignment: rive.Alignment.Center
        });

        riveInstance = new rive.Rive({
            src: filePath,
            canvas: document.getElementById('riveCanvas'),
            artboard: name,
            autoplay: false,
            autoBind: true,
            layout: defaultLayout,
            onLoad: () => {
                riveInstance.resizeDrawingSurfaceToCanvas();

                try {
                    if (window.animationModule) {
                        window.animationModule.populateAnimations(riveInstance);
                    }
                } catch (e) { console.error('[Rive] switchArtboard populateAnimations error:', e); }

                try {
                    if (window.stateMachineModule) {
                        window.stateMachineModule.populateStateMachines(riveInstance);
                    }
                } catch (e) { console.error('[Rive] switchArtboard populateStateMachines error:', e); }

                try {
                    if (window.dataBindingModule) {
                        window.dataBindingModule.populateViewModel(riveInstance);
                    }
                } catch (e) { console.error('[Rive] switchArtboard populateViewModel error:', e); }

                // Start playback if no SM or anim
                const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
                const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

                if (!curSM && !curAnim) {
                    riveInstance.play();
                }
            },
        });

        if (window.playbackModule) {
            window.playbackModule.setPlaying(true);
        }

        // Update global instance reference
        window.riveInstance = riveInstance;
    }

    /**
     * Populate file info
     */
    function populateFileInfo(riveInstance) {
        const fileName = window.currentFilePath.split('/').pop().split('\\').pop();
        document.getElementById('fileName').textContent = fileName;

        const b = riveInstance.bounds;
        const w = b ? Math.round(b.maxX - b.minX) : 0;
        const h = b ? Math.round(b.maxY - b.minY) : 0;

        const anims = riveInstance.animationNames || [];
        const sms = riveInstance.stateMachineNames || [];
        let vmCount = 0;

        try { vmCount = riveInstance.viewModelCount || 0; } catch (e) {}

        document.getElementById('infoDims').textContent = w && h ? w + ' × ' + h : '-';
        document.getElementById('infoAnimCount').textContent = anims.length || '-';
        document.getElementById('infoSMCount').textContent = sms.length || '-';
        document.getElementById('infoVMCount').textContent = vmCount || '-';
    }

    /**
     * Show error message
     */
    function showError(msg) {
        const overlay = document.getElementById('overlay');
        overlay.innerHTML = '<div class="error-msg">' + msg + '</div>';
    }

    /**
     * Show .rev file notice
     */
    function showRevNotice() {
        const fileName = window.currentFilePath.split('/').pop().split('\\').pop();
        document.getElementById('fileName').textContent = fileName;

        // Hide timeline tab
        const timelineTab = document.querySelector('.sidebar-tab[data-tab="timeline"]');
        if (timelineTab) timelineTab.style.display = 'none';

        const overlay = document.getElementById('overlay');
        overlay.innerHTML =
            '<div class="rev-notice">' +
                '<span class="rev-badge">.REV 文件</span>' +
                '<div class="rev-title">Rive 编辑器备份文件</div>' +
                '<div class="rev-desc">' +
                    '这是 Rive 编辑器备份文件（.rev），包含完整的编辑项目数据。' +
                    'Rive 运行时无法预览此文件。<br><br>' +
                    '如需预览动画，请在 Rive 编辑器中打开并导出 .riv（运行时）文件。' +
                '</div>' +
                '<a class="rev-link" href="https://editor.rive.app/" target="_blank">打开 Rive 编辑器</a>' +
            '</div>';
    }

    return {
        setupTabs,
        setupBackgroundSwatches,
        setupArtboardSwitch,
        populateFileInfo,
        showError,
        showRevNotice
    };
})();

/**
 * Main application entry point for Rive viewer
 */

(function() {
    'use strict';

    // ===== Params =====
    const params = new URLSearchParams(location.search);
    const filePath = params.get('path');
    const theme = params.get('theme') || 'light';

    // Store for global access
    window.currentFilePath = filePath;
    window.riveInstance = null;

    // Setup module references early (before any module code runs)
    window.stateMachineModule = window.StateMachine || null;
    window.animationModule = window.Animation || null;
    window.dataBindingModule = window.DataBinding || null;
    window.playbackModule = window.Playback || null;

    // Apply theme
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // ===== Refs =====
    const canvas = document.getElementById('riveCanvas');
    const overlay = document.getElementById('overlay');
    const container = document.getElementById('canvasContainer');

    // ===== Default Layout =====
    const defaultLayout = new rive.Layout({
        fit: rive.Fit.Contain,
        alignment: rive.Alignment.Center
    });

    // ===== Canvas sizing =====
    function fitCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (window.riveInstance) {
            window.riveInstance.resizeDrawingSurfaceToCanvas();
        }
    }

    // ===== Initialize Rive =====
    function initRive() {
        if (!filePath) {
            if (window.UI) {
                window.UI.showError('未指定文件路径');
            }
            return;
        }

        // Check for .rev file (editor backup, runtime cannot load)
        const ext = filePath.split('.').pop().toLowerCase();
        if (ext === 'rev') {
            if (window.UI) {
                window.UI.showRevNotice();
            }
            return;
        }

        fitCanvas();

        window.riveInstance = new rive.Rive({
            src: filePath,
            canvas: canvas,
            autoplay: false,
            autoBind: true,
            layout: defaultLayout,
            onLoad: () => {
                overlay.classList.add('hidden');
                window.riveInstance.resizeDrawingSurfaceToCanvas();
                populateUI();

                // Start playback if no SM or anim
                const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
                const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

                if (!curSM && !curAnim) {
                    window.riveInstance.play();
                }
            },
            onLoadError: () => {
                if (window.UI) {
                    window.UI.showError('Rive 文件加载失败');
                }
            },
        });
    }

    /**
     * Populate all UI elements
     */
    function populateUI() {
        if (!window.riveInstance) return;

        // Setup UI components
        if (window.UI) {
            window.UI.setupTabs(window.riveInstance);
            window.UI.setupBackgroundSwatches();
            window.UI.populateFileInfo(window.riveInstance);
            window.UI.setupArtboardSwitch(window.riveInstance);
        }

        // Populate animations
        try {
            if (window.Animation) {
                window.Animation.populateAnimations(window.riveInstance);
            }
        } catch (e) {
            console.error('[Rive] populateAnimations error:', e);
        }

        // Populate state machines
        try {
            if (window.StateMachine) {
                window.StateMachine.populateStateMachines(window.riveInstance);
            }
        } catch (e) {
            console.error('[Rive] populateStateMachines error:', e);
        }

        // Populate ViewModel
        try {
            if (window.DataBinding) {
                window.DataBinding.populateViewModel(window.riveInstance);
            }
        } catch (e) {
            console.error('[Rive] populateViewModel error:', e);
        }
    }

    // ===== Resize handler =====
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(fitCanvas, 80);
    });

    // ===== Cleanup on unload =====
    window.addEventListener('beforeunload', () => {
        if (window.riveInstance) {
            window.riveInstance.cleanup();
        }
    });

    // ===== Initialize =====
    // Setup playback controls
    if (window.Playback) {
        window.Playback.bindEvents(null); // Will be called with instance later
    }

    // Start
    initRive();

})();

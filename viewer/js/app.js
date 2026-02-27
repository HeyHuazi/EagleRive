/**
 * Main application entry point for Rive viewer
 */

(function() {
    'use strict';

    // ===== Configure Rive to use local WASM file =====
    // rive.webgl2.js 是 UMD 模块，加载后 window.rive 被设置为 SDK 导出对象
    // 通过 RuntimeLoader.setWasmUrl() 设置本地 WASM URL（而非被覆盖的 locateFile）
    if (window.rive && window.rive.RuntimeLoader)
        window.rive.RuntimeLoader.setWasmUrl('./lib/rive.wasm');

    // ===== Loading Animation =====
    let loadingInstance = null;

    function startLoadingAnimation() {
        const loadingCanvas = document.getElementById('loadingCanvas');
        if (!loadingCanvas || !window.rive) return;

        // 根据设备像素比 (DPR) 设置高分辨率
        const dpr = window.devicePixelRatio || 1;
        const displaySize = 600; // CSS 显示尺寸

        // 设置 Canvas 实际分辨率（考虑 DPR）
        loadingCanvas.width = displaySize * dpr;
        loadingCanvas.height = displaySize * dpr;

        try {
            loadingInstance = new rive.Rive({
                src: './poison_loader.riv',
                canvas: loadingCanvas,
                autoplay: true,
                layout: new rive.Layout({
                    fit: rive.Fit.Contain,
                    alignment: rive.Alignment.Center,
                }),
                onLoad: function() {
                    // Loading animation loaded and started
                },
                onLoadError: function() {
                    console.warn('[Rive] Loading animation failed to load');
                    // Hide loading canvas if animation fails
                    loadingCanvas.style.display = 'none';
                },
            });
        } catch (e) {
            console.warn('[Rive] Failed to start loading animation:', e);
        }
    }

    function stopLoadingAnimation() {
        if (loadingInstance) {
            try {
                loadingInstance.cleanup();
            } catch (e) {
                // Ignore cleanup errors
            }
            loadingInstance = null;
        }
    }

    // ===== Params =====
    const params = new URLSearchParams(location.search);
    const filePath = params.get('path');
    const theme = params.get('theme') || 'light';

    // Store for global access
    window.currentFilePath = filePath;
    window.riveInstance = null;
    window.cachedRiveBuffer = null;

    // Setup module references early (before any module code runs)
    window.stateMachineModule = window.StateMachine || null;
    window.animationModule = window.Animation || null;
    window.dataBindingModule = window.DataBinding || null;
    window.playbackModule = window.Playback || null;
    window.zoomModule = window.Zoom || null;

    // Apply theme
    if (theme === 'dark') document.body.classList.add('dark-theme');

    // ===== Refs =====
    const canvas = document.getElementById('riveCanvas');
    const overlay = document.getElementById('overlay');
    const container = document.getElementById('canvasContainer');

    // ===== Default Layout =====
    const defaultLayout = new rive.Layout({
        fit: rive.Fit.Contain,
        alignment: rive.Alignment.Center,
    });

    // ===== Canvas sizing =====
    function fitCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (window.riveInstance) window.riveInstance.resizeDrawingSurfaceToCanvas();
    }

    // ===== Initialize Rive =====
    function initRive() {
        if (!filePath) {
            if (window.UI) window.UI.showError(window.i18n ? window.i18n.t('errors.noFilePath') : '未指定文件路径');

            return;
        }

        // Check for .rev file (editor backup, runtime cannot load)
        const ext = filePath.split('.').pop().toLowerCase();
        if (ext === 'rev') {
            // Stop loading animation since we're showing a notice
            stopLoadingAnimation();

            if (window.UI) window.UI.showRevNotice();

            return;
        }

        // Start loading animation
        startLoadingAnimation();

        fitCanvas();

        // 先 fetch 文件为 ArrayBuffer 并缓存，后续画板切换可复用
        fetch(filePath)
            .then(function(resp) {
                return resp.arrayBuffer();
            })
            .then(function(buffer) {
                window.cachedRiveBuffer = buffer;
                createRiveInstance(buffer);
            })
            .catch(function() {
                if (window.UI) window.UI.showError(window.i18n ? window.i18n.t('errors.loadFailed') : 'Rive 文件加载失败');
            });
    }

    function createRiveInstance(buffer, artboardName) {
        const opts = {
            buffer: buffer,
            canvas: canvas,
            autoplay: false,
            autoBind: true,
            layout: defaultLayout,
            onLoad: function() {
                // Stop loading animation when main file is loaded
                stopLoadingAnimation();

                overlay.classList.add('hidden');
                window.riveInstance.resizeDrawingSurfaceToCanvas();
                populateUI();

                // Start playback if no SM or anim
                const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
                const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

                if (!curSM && !curAnim) window.riveInstance.play();
            },
            onLoadError: function() {
                // Stop loading animation on error
                stopLoadingAnimation();

                if (window.UI) window.UI.showError(window.i18n ? window.i18n.t('errors.loadFailed') : 'Rive 文件加载失败');
            },
        };
        if (artboardName) opts.artboard = artboardName;

        window.riveInstance = new rive.Rive(opts);
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
            if (window.Animation) window.Animation.populateAnimations(window.riveInstance);
        } catch (e) {
            console.error('[Rive] populateAnimations error:', e);
        }

        // Populate state machines
        try {
            if (window.StateMachine) window.StateMachine.populateStateMachines(window.riveInstance);
        } catch (e) {
            console.error('[Rive] populateStateMachines error:', e);
        }

        // Populate ViewModel
        try {
            if (window.DataBinding) window.DataBinding.populateViewModel(window.riveInstance);
        } catch (e) {
            console.error('[Rive] populateViewModel error:', e);
        }

        // Apply initial time scale for playback speed
        if (window.Playback) window.Playback.applyTimeScale();
    }

    // ===== Resize handler =====
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(fitCanvas, 80);
    });

    // ===== Keyboard shortcuts =====
    document.addEventListener('keydown', function(e) {
    // Zoom shortcuts (Ctrl/Cmd + +, -, 0)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                if (window.Zoom) window.Zoom.zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                if (window.Zoom) window.Zoom.zoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                if (window.Zoom) window.Zoom.resetZoom();
            }
        }
    });

    // ===== Cleanup on unload =====
    window.addEventListener('beforeunload', () => {
        if (window.riveInstance) window.riveInstance.cleanup();
    });

    // ===== Initialize =====
    // Setup playback UI controls (speed & direction)
    try {
        if (window.PlaybackControls) window.PlaybackControls.init();
    } catch (e) {
        console.error('[App] PlaybackControls init error:', e);
    }

    // Setup zoom controls
    try {
        if (window.Zoom) window.Zoom.initControls();
    } catch (e) {
        console.error('[App] Zoom init error:', e);
    }

    // Setup performance monitoring
    try {
        if (window.Performance) window.Performance.init();
    } catch (e) {
        console.error('[App] Performance init error:', e);
    }

    // Setup shortcuts help
    try {
        if (window.Shortcuts) window.Shortcuts.init();
    } catch (e) {
        console.error('[App] Shortcuts init error:', e);
    }

    // Expose createRiveInstance for artboard switching
    window.createRiveInstance = createRiveInstance;

    // Start
    initRive();
})();

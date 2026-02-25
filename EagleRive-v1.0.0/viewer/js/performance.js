/**
 * Performance monitoring module
 */

(function() {
    'use strict';

    // State
    let fps = 0;
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId = null;
    let updateInterval = 500; // Update every 500ms

    /**
     * Update FPS calculation
     */
    function updateFPS() {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastTime;

        if (elapsed >= updateInterval) {
            fps = Math.round((frameCount * 1000) / elapsed);
            frameCount = 0;
            lastTime = currentTime;

            updateDisplay();
        }

        animationFrameId = requestAnimationFrame(updateFPS);
    }

    /**
     * Update FPS display
     */
    function updateDisplay() {
        const display = document.getElementById('fpsDisplay');
        if (display) {
            display.textContent = fps + ' FPS';

            // Update color class
            display.className = 'fps-indicator ' + getFPSClass(fps);
        }
    }

    /**
     * Get CSS class based on FPS value
     */
    function getFPSClass(fpsValue) {
        if (fpsValue >= 55) return 'fps-good';
        if (fpsValue >= 30) return 'fps-ok';
        return 'fps-poor';
    }

    /**
     * Start FPS monitoring
     */
    function start() {
        if (animationFrameId === null) {
            lastTime = performance.now();
            frameCount = 0;
            animationFrameId = requestAnimationFrame(updateFPS);
        }
    }

    /**
     * Stop FPS monitoring
     */
    function stop() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    /**
     * Initialize FPS monitor
     */
    function initFPSMonitor() {
        try {
            // Find canvas area container
            const canvasArea = document.querySelector('.canvas-area');
            if (!canvasArea) {
                console.warn('[Performance] Canvas area not found');
                return;
            }

            // Check if FPS display already exists
            let fpsDisplay = document.getElementById('fpsDisplay');
            if (!fpsDisplay) {
                fpsDisplay = document.createElement('div');
                fpsDisplay.id = 'fpsDisplay';
                fpsDisplay.className = 'fps-indicator fps-good';
                fpsDisplay.textContent = '-- FPS';
                fpsDisplay.title = '帧率显示';
                canvasArea.appendChild(fpsDisplay);
            }

            // Start monitoring after a short delay to ensure DOM is ready
            setTimeout(() => {
                start();
            }, 100);
        } catch (e) {
            console.error('[Performance] Initialization error:', e);
        }
    }

    /**
     * Get current FPS value
     */
    function getFPS() {
        return fps;
    }

    /**
     * Set update interval
     */
    function setUpdateInterval(interval) {
        updateInterval = Math.max(100, interval); // Minimum 100ms
    }

    // Expose public API
    window.Performance = {
        init: initFPSMonitor,
        start,
        stop,
        getFPS,
        setUpdateInterval
    };
})();

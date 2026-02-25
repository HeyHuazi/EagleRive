/**
 * Playback controls UI module
 * Initializes speed slider and direction button
 */

(function() {
    'use strict';

    /**
     * Initialize speed control slider
     */
    function initSpeedControl() {
        const controlsBar = document.querySelector('.controls-bar');
        if (!controlsBar) {
            console.warn('[PlaybackControls] Controls bar not found');
            return;
        }

        // Create speed control container
        const speedControl = document.createElement('div');
        speedControl.className = 'speed-control';
        speedControl.innerHTML = `
            <label for="speedSlider">速度</label>
            <input type="range"
                   id="speedSlider"
                   min="0.1"
                   max="3.0"
                   step="0.1"
                   value="1.0">
            <span id="speedDisplay">100%</span>
        `;

        const slider = speedControl.querySelector('#speedSlider');
        slider.addEventListener('input', (e) => {
            if (window.Playback) {
                const speed = parseFloat(e.target.value);
                window.Playback.setSpeed(speed);
            }
        });

        // Insert before background swatches
        const bgSwatches = controlsBar.querySelector('.bg-swatches');
        if (bgSwatches) {
            controlsBar.insertBefore(speedControl, bgSwatches);
        } else {
            controlsBar.appendChild(speedControl);
        }

        // Initialize display
        if (window.Playback) {
            window.Playback.updateSpeedDisplay();
        }
    }

    /**
     * Initialize direction toggle button
     */
    function initDirectionButton() {
        const controlsBar = document.querySelector('.controls-bar');
        if (!controlsBar) {
            console.warn('[PlaybackControls] Controls bar not found');
            return;
        }

        // Create direction button
        const directionBtn = document.createElement('button');
        directionBtn.id = 'directionBtn';
        directionBtn.className = 'direction-btn';
        directionBtn.title = '方向: 正向 (点击切换)';
        directionBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;

        directionBtn.addEventListener('click', () => {
            if (window.Playback) {
                window.Playback.toggleDirection();
            }
        });

        // Insert after zoom controls
        const zoomControls = controlsBar.querySelector('.zoom-controls');
        if (zoomControls && zoomControls.nextSibling) {
            controlsBar.insertBefore(directionBtn, zoomControls.nextSibling);
        } else {
            controlsBar.appendChild(directionBtn);
        }

        // Initialize button state
        if (window.Playback) {
            window.Playback.updateDirectionButton();
        }
    }

    /**
     * Initialize all playback controls
     */
    function initPlaybackControls() {
        initSpeedControl();
    }

    // Expose public API
    window.PlaybackControls = {
        init: initPlaybackControls,
        initSpeedControl
    };
})();

/**
 * Playback control module for Rive
 * Handles speed and direction controls
 */

const Playback = (function() {
    let playbackSpeed = 1.0;
    let playDirection = 1; // 1: forward, -1: backward
    const minSpeed = 0.1;
    const maxSpeed = 3.0;

    /**
     * Set playback speed
     */
    function setSpeed(speed) {
        playbackSpeed = Math.max(minSpeed, Math.min(maxSpeed, speed));
        applyTimeScale();
        updateSpeedDisplay();
    }

    /**
     * Get current playback speed
     */
    function getSpeed() {
        return playbackSpeed;
    }

    /**
     * Update speed display UI
     */
    function updateSpeedDisplay() {
        const display = document.getElementById('speedDisplay');
        const slider = document.getElementById('speedSlider');

        if (display) {
            const percentage = Math.round(playbackSpeed * 100);
            display.textContent = percentage + '%';
        }

        if (slider) {
            slider.value = playbackSpeed;
        }
    }

    /**
     * Toggle playback direction
     */
    function toggleDirection() {
        playDirection *= -1;
        applyTimeScale();
        updateDirectionButton();
    }

    /**
     * Get current playback direction
     */
    function getDirection() {
        return playDirection;
    }

    /**
     * Update direction button appearance
     */
    function updateDirectionButton() {
        const btn = document.getElementById('directionBtn');
        if (!btn) return;

        if (playDirection === -1) {
            btn.classList.add('active');
            btn.title = '方向: 反向 (点击切换)';
        } else {
            btn.classList.remove('active');
            btn.title = '方向: 正向 (点击切换)';
        }
    }

    /**
     * Apply time scale to Rive instance
     */
    function applyTimeScale() {
        if (window.riveInstance) {
            const timeScale = playbackSpeed * playDirection;
            window.riveInstance.timeScale = timeScale;
        }
    }

    return {
        // Speed control
        setSpeed,
        getSpeed,
        updateSpeedDisplay,
        // Direction control
        toggleDirection,
        getDirection,
        updateDirectionButton,
        applyTimeScale
    };
})();

// Expose to global window object
window.Playback = Playback;

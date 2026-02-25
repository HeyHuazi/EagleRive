/**
 * Playback control module for Rive
 */

const Playback = (function() {
    let playing = true;

    const btnPlay = document.getElementById('btnPlay');
    const btnRestart = document.getElementById('btnRestart');
    const playLabel = document.getElementById('playLabel');
    const icoPlay = document.getElementById('icoPlay');

    /**
     * Update play/pause icon
     */
    function updatePlayIcon() {
        if (playing) {
            // Pause icon (Remix Icon)
            icoPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4z"/><path d="M14 4h4v16h-4V4z"/></svg>';
            playLabel.textContent = '暂停';
        } else {
            // Play icon (Remix Icon)
            icoPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l14 8-14 8V4z"/></svg>';
            playLabel.textContent = '播放';
        }
    }

    /**
     * Toggle play/pause
     */
    function togglePlayPause(riveInstance) {
        if (!riveInstance) return;

        if (playing) {
            riveInstance.pause();
        } else {
            // Resume playback based on current mode
            const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
            const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

            if (curSM) {
                riveInstance.play(curSM);
            } else if (curAnim) {
                riveInstance.play(curAnim);
            } else {
                riveInstance.play();
            }
        }

        playing = !playing;
        updatePlayIcon();
    }

    /**
     * Restart playback
     */
    function restart(riveInstance) {
        if (!riveInstance) return;

        const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
        const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

        riveInstance.reset();

        if (curSM) {
            riveInstance.play(curSM);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (window.stateMachineModule) {
                    window.stateMachineModule.loadSMInputs(riveInstance, curSM);
                }
            }));
        } else if (curAnim) {
            riveInstance.play(curAnim);
        } else {
            riveInstance.play();
        }

        playing = true;
        updatePlayIcon();
    }

    /**
     * Bind playback control events
     */
    function bindEvents(riveInstance) {
        btnPlay.addEventListener('click', () => togglePlayPause(riveInstance));
        btnRestart.addEventListener('click', () => restart(riveInstance));

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            // Note: Space key is handled by Zoom module for pan functionality
            if (e.code === 'KeyR') {
                btnRestart.click();
            }
        });
    }

    return {
        updatePlayIcon,
        togglePlayPause,
        restart,
        bindEvents,
        setPlaying: (isPlaying) => { playing = isPlaying; updatePlayIcon(); },
        isPlaying: () => playing
    };
})();

// Expose to global window object
window.Playback = Playback;

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
            icoPlay.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            playLabel.textContent = '暂停';
        } else {
            icoPlay.innerHTML = '<polygon points="6,4 20,12 6,20"/>';
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
            if (e.code === 'Space') {
                e.preventDefault();
                btnPlay.click();
            } else if (e.code === 'KeyR') {
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

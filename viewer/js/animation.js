/**
 * Animation module for Rive
 */

const Animation = (function() {
    let currentAnim = null;

    /**
     * Populate animation list
     */
    function populateAnimations(riveInstance) {
        const anims = riveInstance.animationNames || [];
        const list = document.getElementById('animList');

        if (!anims.length) {
            list.innerHTML = '<div class="empty">暂无动画</div>';
            return;
        }

        currentAnim = anims[0];
        list.innerHTML = anims.map((a, i) =>
            '<div class="item' + (i === 0 ? ' active' : '') + '" data-anim="' + a + '">' + a + '</div>'
        ).join('');

        list.querySelectorAll('.item').forEach(function(el) {
            el.addEventListener('click', function() {
                list.querySelectorAll('.item').forEach(function(x) { x.classList.remove('active'); });
                el.classList.add('active');

                // Stop current state machine if running
                var curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
                if (curSM) {
                    try { riveInstance.stop(curSM); } catch (e) {}
                }

                // Stop current animation
                if (currentAnim) {
                    try { riveInstance.stop(currentAnim); } catch (e) {}
                }

                currentAnim = el.dataset.anim;
                riveInstance.play(currentAnim);
            });
        });
    }

    function playAnim(riveInstance, name) {
        if (name) {
            riveInstance.play(name);
        }
    }

    return {
        populateAnimations,
        playAnim,
        getCurrentAnim: () => currentAnim,
        setCurrentAnim: (anim) => { currentAnim = anim; }
    };
})();

// Expose to global window object
window.Animation = Animation;

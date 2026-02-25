/**
 * State Machine module for Rive
 */

const StateMachine = (function() {
    let currentSM = null;
    let inputs = [];

    /**
     * Populate state machine dropdown
     */
    function populateStateMachines(riveInstance) {
        const sms = riveInstance.stateMachineNames || [];
        const smSection = document.getElementById('smSection');
        const sel = document.getElementById('smSelect');

        document.getElementById('smSection').style.display = sms.length ? '' : 'none';

        sel.innerHTML = sms.length
            ? sms.map(s => '<option value="' + s + '">' + s + '</option>').join('')
            : '<option value="">暂无状态机</option>';

        sel.onchange = () => {
            if (sel.value) {
                playSM(riveInstance, sel.value);
                requestAnimationFrame(() => requestAnimationFrame(() => loadSMInputs(riveInstance, sel.value)));
            }
        };

        if (sms.length) {
            playSM(riveInstance, sms[0]);
            requestAnimationFrame(() => requestAnimationFrame(() => loadSMInputs(riveInstance, sms[0])));
        }
    }

    /**
     * Play a state machine
     */
    function playSM(riveInstance, name) {
        const { playAnim, getCurrentAnim } = window.Animation || {};

        // Stop current animation if any
        const curAnim = getCurrentAnim ? getCurrentAnim() : null;
        if (curAnim) {
            try { riveInstance.stop(curAnim); } catch (e) {}
        }

        // Stop previous SM if different
        if (currentSM && currentSM !== name) {
            try { riveInstance.stop(currentSM); } catch (e) {}
        }

        currentSM = name;
        riveInstance.play(name);

        // Update playing state in Playback module
        if (window.playbackModule) {
            window.playbackModule.setPlaying(true);
        }
    }

    /**
     * Load state machine inputs
     */
    function loadSMInputs(riveInstance, name) {
        const box = document.getElementById('smInputs');
        box.style.display = 'none';
        box.innerHTML = '';
        inputs = [];

        try {
            const smInputs = riveInstance.stateMachineInputs(name);
            if (!smInputs || smInputs.length === 0) return;

            inputs = smInputs;
            const triggers = [];
            const bools = [];
            const nums = [];

            for (let i = 0; i < inputs.length; i++) {
                const inp = inputs[i];
                const type = inp.type;

                if (type === rive.StateMachineInputType.Trigger) {
                    triggers.push(inp);
                } else if (type === rive.StateMachineInputType.Boolean) {
                    bools.push(inp);
                } else if (type === rive.StateMachineInputType.Number) {
                    nums.push(inp);
                }
            }

            let html = '';

            if (triggers.length) {
                html += '<div class="sm-type-group"><div class="sm-type-hd">触发器 <span class="sm-type-badge">' +
                        triggers.length + '</span></div><div class="trigger-grid">';
                triggers.forEach(function(t) {
                    html += '<button class="trigger-btn" data-trigger="' + RiveUtils.escapeAttr(t.name) + '">' +
                            RiveUtils.escapeAttr(t.name) + '</button>';
                });
                html += '</div></div>';
            }

            if (bools.length) {
                html += '<div class="sm-type-group"><div class="sm-type-hd">布尔值 <span class="sm-type-badge">' +
                        bools.length + '</span></div>';
                bools.forEach(function(b) {
                    html += '<div class="icard"><div class="sw-row"><span class="icard-label" style="margin:0">' +
                            RiveUtils.escapeAttr(b.name) +
                            '</span><label class="sw"><input type="checkbox" data-bool="' +
                            RiveUtils.escapeAttr(b.name) + '"' + (b.value ? ' checked' : '') +
                            '><span class="sw-track"></span></label></div></div>';
                });
                html += '</div>';
            }

            if (nums.length) {
                html += '<div class="sm-type-group"><div class="sm-type-hd">数值 <span class="sm-type-badge">' +
                        nums.length + '</span></div>';
                nums.forEach(function(n) {
                    html += '<div class="icard"><label class="icard-label">' + RiveUtils.escapeAttr(n.name) +
                            '</label><input type="number" class="ninput" data-num="' +
                            RiveUtils.escapeAttr(n.name) + '" value="' + n.value + '" step="any"></div>';
                });
                html += '</div>';
            }

            if (html) {
                box.innerHTML = html;
                box.style.display = '';
                bindSMEvents(riveInstance);
            }
        } catch (e) {
            console.warn('[Rive] Failed to load SM inputs:', e);
        }
    }

    /**
     * Bind state machine input events
     */
    function bindSMEvents(riveInstance) {
        const box = document.getElementById('smInputs');

        // Triggers
        box.querySelectorAll('[data-trigger]').forEach(function(el) {
            el.addEventListener('click', function() {
                const inp = inputs.find(i => i.name === this.dataset.trigger);
                if (inp) {
                    inp.fire();
                    console.log('[Rive] SM trigger fired:', this.dataset.trigger);
                } else {
                    console.warn('[Rive] SM trigger not found:', this.dataset.trigger);
                }
            });
        });

        // Booleans
        box.querySelectorAll('[data-bool]').forEach(function(el) {
            el.addEventListener('change', function() {
                const inp = inputs.find(i => i.name === this.dataset.bool);
                if (inp) {
                    inp.value = this.checked;
                    console.log('[Rive] SM bool set:', this.dataset.bool, '=', this.checked);
                } else {
                    console.warn('[Rive] SM bool not found:', this.dataset.bool);
                }
            });
        });

        // Numbers
        box.querySelectorAll('[data-num]').forEach(function(el) {
            el.addEventListener('input', function() {
                const inp = inputs.find(i => i.name === this.dataset.num);
                if (inp) {
                    inp.value = parseFloat(this.value) || 0;
                    console.log('[Rive] SM num set:', this.dataset.num, '=', parseFloat(this.value) || 0);
                } else {
                    console.warn('[Rive] SM num not found:', this.dataset.num);
                }
            });
        });
    }

    return {
        populateStateMachines,
        playSM,
        loadSMInputs,
        getCurrentSM: () => currentSM,
        setCurrentSM: (sm) => { currentSM = sm; }
    };
})();

// Expose to global window object
window.StateMachine = StateMachine;

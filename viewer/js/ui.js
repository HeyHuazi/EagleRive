/**
 * UI module for Rive viewer
 */

const UI = (function () {
  /**
   * Setup tab switching
   */
  function setupTabs(riveInstance) {
    document.querySelectorAll('.sidebar-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.sidebar-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        document.querySelectorAll('.panel').forEach(function (p) {
          p.classList.remove('active');
        });

        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');

        const curSM = window.stateMachineModule ? window.stateMachineModule.getCurrentSM() : null;
        const curAnim = window.animationModule ? window.animationModule.getCurrentAnim() : null;

        // Tab switching logic
        if (tab.dataset.tab === 'timeline') {
          // Switch to animation mode - stop state machine
          if (curSM && window.riveInstance) window.riveInstance.stop(curSM);

          // Play animation if exists, or play first animation
          if (curAnim && window.riveInstance) {
            if (window.animationModule) window.animationModule.playAnim(riveInstance, curAnim);
          } else if (window.riveInstance) {
            const anims = window.riveInstance.animationNames || [];
            if (anims.length > 0) {
              if (window.animationModule) {
                window.animationModule.setCurrentAnim(anims[0]);
                window.animationModule.playAnim(riveInstance, anims[0]);
              }
            }
          }
        } else if (tab.dataset.tab === 'statemachine') {
          // Switch to state machine mode - stop animation
          if (curAnim && window.riveInstance) window.riveInstance.stop(curAnim);

          // Play state machine if exists
          if (curSM && window.riveInstance) {
            if (window.stateMachineModule) window.stateMachineModule.playSM(riveInstance, curSM);
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

    document.querySelectorAll('.bg-swatch').forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        document.querySelectorAll('.bg-swatch').forEach(function (s) {
          s.classList.remove('active');
        });
        swatch.classList.add('active');

        container.className = 'canvas-container';
        const bg = swatch.dataset.bg;

        if (bg === 'checker') container.classList.add('bg-checker');
        else if (bg === 'white') container.classList.add('bg-white');
        else if (bg === 'black') container.classList.add('bg-black');
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

      sel.addEventListener('change', function () {
        switchArtboard(riveInstance, sel.value);
      });
    }
  }

  /**
   * Switch artboard (复用缓存的 buffer，避免重新 fetch 文件)
   */
  function switchArtboard(riveInstance, name) {
    if (riveInstance) riveInstance.cleanup();

    // Reset current SM and anim
    if (window.stateMachineModule) window.stateMachineModule.setCurrentSM(null);

    if (window.animationModule) window.animationModule.setCurrentAnim(null);

    // 使用 app.js 暴露的 createRiveInstance 和缓存的 buffer
    if (window.createRiveInstance && window.cachedRiveBuffer)
      window.createRiveInstance(window.cachedRiveBuffer, name);

    if (window.playbackModule) window.playbackModule.setPlaying(true);
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

    try {
      vmCount = riveInstance.viewModelCount || 0;
    } catch (e) {}

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

    const revBadge = window.i18n ? window.i18n.t('messages.revBadge') : '.REV 文件';
    const revTitle = window.i18n ? window.i18n.t('messages.revTitle') : 'Rive 编辑器备份文件';
    const revDesc = window.i18n
      ? window.i18n.t('messages.revNotice')
      : 'Rive 运行时无法预览此文件。<br><br>如需预览动画，请在 Rive 编辑器中打开并导出 .riv（运行时）文件。';
    const openEditor = window.i18n ? window.i18n.t('messages.openEditor') : '打开 Rive 编辑器';

    const overlay = document.getElementById('overlay');
    overlay.innerHTML =
      '<div class="rev-notice">' +
      '<span class="rev-badge">' +
      revBadge +
      '</span>' +
      '<div class="rev-title">' +
      revTitle +
      '</div>' +
      '<div class="rev-desc">' +
      '这是 Rive 编辑器备份文件（.rev），包含完整的编辑项目数据。' +
      revDesc +
      '</div>' +
      '<a class="rev-link" href="https://editor.rive.app/" target="_blank">' +
      openEditor +
      '</a>' +
      '</div>';
  }

  return {
    setupTabs,
    setupBackgroundSwatches,
    setupArtboardSwitch,
    populateFileInfo,
    showError,
    showRevNotice,
  };
})();

// Expose to global window object
window.UI = UI;

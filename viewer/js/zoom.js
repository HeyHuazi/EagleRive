/**
 * Zoom control module for Rive viewer
 */

const Zoom = (function() {
    let scale = 1;
    const minScale = 0.1;
    const maxScale = 10;

    /**
     * Set zoom level
     */
    function setZoom(newScale) {
        scale = Math.max(minScale, Math.min(maxScale, newScale));
        updateCanvasTransform();
        updateZoomDisplay();
    }

    /**
     * Update canvas CSS transform
     */
    function updateCanvasTransform() {
        const canvas = document.getElementById('riveCanvas');
        if (canvas) {
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'center center';
        }
    }

    /**
     * Update zoom display text
     */
    function updateZoomDisplay() {
        const display = document.getElementById('zoomDisplay');
        if (display) {
            display.textContent = Math.round(scale * 100) + '%';
        }
    }

    /**
     * Zoom in
     */
    function zoomIn() {
        setZoom(scale * 1.2);
    }

    /**
     * Zoom out
     */
    function zoomOut() {
        setZoom(scale / 1.2);
    }

    /**
     * Reset zoom to 100%
     */
    function resetZoom() {
        setZoom(1);
    }

    /**
     * Fit to container
     */
    function fitToContainer() {
        setZoom(1);
    }

    /**
     * Handle mouse wheel zoom
     */
    function handleWheel(event) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? 0.9 : 1.1;
            setZoom(scale * delta);
        }
    }

    /**
     * Initialize zoom controls
     */
    function initControls() {
        const canvasContainer = document.getElementById('canvasContainer');

        if (canvasContainer) {
            // Mouse wheel zoom with Ctrl/Cmd key
            canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
        }

        // Zoom in button
        const zoomInBtn = document.getElementById('zoomInBtn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', zoomIn);
        }

        // Zoom out button
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', zoomOut);
        }

        // Reset zoom button
        const zoomResetBtn = document.getElementById('zoomResetBtn');
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', resetZoom);
        }
    }

    return {
        setZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        fitToContainer,
        initControls,
        getScale: () => scale
    };
})();

// Expose to global window object
window.Zoom = Zoom;

/**
 * Zoom control module for Rive viewer
 */

const Zoom = (function() {
    let scale = 1;
    const minScale = 0.1;
    const maxScale = 10;

    // Pan state
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let translateX = 0;
    let translateY = 0;
    let hasPanned = false; // Track if user actually dragged while space was pressed

    /**
     * Set zoom level with optional mouse position
     */
    function setZoom(newScale, mouseX, mouseY) {
        const oldScale = scale;
        scale = Math.max(minScale, Math.min(maxScale, newScale));

        // Calculate zoom center (mouse position if provided, otherwise center of canvas)
        const canvas = document.getElementById('riveCanvas');
        if (canvas && mouseX !== undefined && mouseY !== undefined) {
            const rect = canvas.getBoundingClientRect();
            const canvasCenterX = rect.width / 2;
            const canvasCenterY = rect.height / 2;

            // Calculate mouse position relative to canvas center
            const mouseRelativeX = mouseX - rect.left - canvasCenterX;
            const mouseRelativeY = mouseY - rect.top - canvasCenterY;

            // Adjust translate to keep mouse position fixed during zoom
            translateX += (mouseRelativeX * (oldScale - scale)) / oldScale;
            translateY += (mouseRelativeY * (oldScale - scale)) / oldScale;
        } else {
            // Reset to center when no mouse position provided
            if (newScale === 1) {
                translateX = 0;
                translateY = 0;
            }
        }

        updateCanvasTransform();
        updateZoomDisplay();
    }

    /**
     * Update canvas CSS transform with scale and translation
     */
    function updateCanvasTransform() {
        const canvas = document.getElementById('riveCanvas');
        if (canvas) {
            canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
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
     * Zoom in (center of canvas)
     */
    function zoomIn() {
        setZoom(scale * 1.2);
    }

    /**
     * Zoom out (center of canvas)
     */
    function zoomOut() {
        setZoom(scale / 1.2);
    }

    /**
     * Reset zoom to 100% and reset pan
     */
    function resetZoom() {
        setZoom(1);
        translateX = 0;
        translateY = 0;
        updateCanvasTransform();
    }

    /**
     * Fit to container
     */
    function fitToContainer() {
        resetZoom();
    }

    /**
     * Handle mouse wheel zoom with mouse position
     */
    function handleWheel(event) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? 0.9 : 1.1;
            setZoom(scale * delta, event.clientX, event.clientY);
        } else if (isPanning) {
            // Regular wheel: pan if space is pressed
            event.preventDefault();
            translateX -= event.deltaX;
            translateY -= event.deltaY;
            updateCanvasTransform();
        }
    }

    /**
     * Start panning (on space key down)
     */
    function startPan() {
        isPanning = true;
        hasPanned = false;
        const canvas = document.getElementById('canvasContainer');
        if (canvas) {
            canvas.style.cursor = 'grab';
        }
    }

    /**
     * Stop panning (on space key up)
     */
    function stopPan() {
        isPanning = false;
        const canvas = document.getElementById('canvasContainer');
        if (canvas) {
            canvas.style.cursor = 'default';
        }
    }

    /**
     * Handle pan drag
     */
    function handlePanStart(event) {
        if (isPanning) {
            event.preventDefault();
            panStartX = event.clientX - translateX;
            panStartY = event.clientY - translateY;
            const canvas = document.getElementById('canvasContainer');
            if (canvas) {
                canvas.style.cursor = 'grabbing';
            }
        }
    }

    function handlePanMove(event) {
        if (isPanning && event.buttons === 1) {
            event.preventDefault();
            hasPanned = true;
            translateX = event.clientX - panStartX;
            translateY = event.clientY - panStartY;
            updateCanvasTransform();
        }
    }

    function handlePanEnd() {
        if (isPanning) {
            const canvas = document.getElementById('canvasContainer');
            if (canvas) {
                canvas.style.cursor = 'grab';
            }
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

            // Pan events
            canvasContainer.addEventListener('mousedown', handlePanStart);
            document.addEventListener('mousemove', handlePanMove);
            document.addEventListener('mouseup', handlePanEnd);
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

        // Keyboard shortcuts for pan
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space' && !e.repeat) {
                // Check if not typing in input field
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    startPan();
                }
            }
        });

        document.addEventListener('keyup', function(e) {
            if (e.code === 'Space') {
                stopPan();
            }
        });
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

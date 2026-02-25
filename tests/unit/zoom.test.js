/**
 * Unit tests for Zoom module
 */

describe('Zoom module', () => {
    let canvas, canvasContainer, zoomDisplay;
    let zoomInBtn, zoomOutBtn, zoomResetBtn;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="canvasContainer">
                <canvas id="riveCanvas"></canvas>
            </div>
            <div id="zoomDisplay">100%</div>
            <button id="zoomInBtn"></button>
            <button id="zoomOutBtn"></button>
            <button id="zoomResetBtn"></button>
        `;

        canvas = document.getElementById('riveCanvas');
        canvasContainer = document.getElementById('canvasContainer');
        zoomDisplay = document.getElementById('zoomDisplay');
        zoomInBtn = document.getElementById('zoomInBtn');
        zoomOutBtn = document.getElementById('zoomOutBtn');
        zoomResetBtn = document.getElementById('zoomResetBtn');

        // Set canvas dimensions
        canvas.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            top: 100,
            width: 800,
            height: 600,
            right: 900,
            bottom: 700
        }));

        // Load zoom module after DOM is setup
        loadModule('zoom.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setZoom', () => {
        it('should set zoom level', () => {
            const Zoom = window.Zoom;

            Zoom.setZoom(2.0);

            expect(Zoom.getScale()).toBe(2.0);
            expect(zoomDisplay.textContent).toBe('200%');
        });

        it('should respect min scale limit', () => {
            const Zoom = window.Zoom;

            Zoom.setZoom(0.05);

            expect(Zoom.getScale()).toBe(0.1);
            expect(zoomDisplay.textContent).toBe('10%');
        });

        it('should respect max scale limit', () => {
            const Zoom = window.Zoom;

            Zoom.setZoom(15.0);

            expect(Zoom.getScale()).toBe(10.0);
            expect(zoomDisplay.textContent).toBe('1000%');
        });

        it('should center zoom on mouse position', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(1.0); // Start at 100%
            const initialTransform = canvas.style.transform;

            Zoom.setZoom(2.0, 500, 400); // Zoom to 200% at mouse position

            expect(Zoom.getScale()).toBe(2.0);
            expect(canvas.style.transform).not.toBe(initialTransform);
        });
    });

    describe('zoomIn', () => {
        it('should increase zoom level by 1.2x', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(1.0);

            Zoom.zoomIn();

            expect(Zoom.getScale()).toBe(1.2);
        });

        it('should not exceed max scale', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(9.0);

            Zoom.zoomIn();

            expect(Zoom.getScale()).toBe(10.0);
        });
    });

    describe('zoomOut', () => {
        it('should decrease zoom level by 1/1.2', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(1.2);

            Zoom.zoomOut();

            expect(Zoom.getScale()).toBeCloseTo(1.0, 1);
        });

        it('should not go below min scale', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(0.11);

            Zoom.zoomOut();

            expect(Zoom.getScale()).toBe(0.1);
        });
    });

    describe('resetZoom', () => {
        it('should reset zoom to 100%', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(3.0);

            Zoom.resetZoom();

            expect(Zoom.getScale()).toBe(1.0);
            expect(zoomDisplay.textContent).toBe('100%');
        });

        it('should reset translate to 0', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(2.0, 500, 400); // This sets some translate

            Zoom.resetZoom();

            expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1)');
        });
    });

    describe('fitToContainer', () => {
        it('should reset zoom', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(2.5);

            Zoom.fitToContainer();

            expect(Zoom.getScale()).toBe(1.0);
        });
    });

    describe('updateCanvasTransform', () => {
        it('should update canvas transform style', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(1.5);

            expect(canvas.style.transform).toContain('scale(1.5)');
            expect(canvas.style.transform).toContain('translate(');
        });
    });

    describe('initControls', () => {
        it('should be callable without errors', () => {
            const Zoom = window.Zoom;

            // Just check it doesn't throw
            expect(() => {
                Zoom.initControls();
            }).not.toThrow();
        });
    });

    describe('handleWheel', () => {
        it('should zoom in with Ctrl+scroll up', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(1.0);

            const wheelEvent = new WheelEvent('wheel', {
                deltaY: -100,
                ctrlKey: true,
                clientX: 500,
                clientY: 400
            });

            Zoom.initControls();
            canvasContainer.dispatchEvent(wheelEvent);

            // Should have zoomed in (scale > 1.0)
            expect(Zoom.getScale()).toBeGreaterThan(1.0);
        });

        it('should zoom out with Ctrl+scroll down', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(2.0);

            const wheelEvent = new WheelEvent('wheel', {
                deltaY: 100,
                ctrlKey: true,
                clientX: 500,
                clientY: 400
            });

            Zoom.initControls();
            canvasContainer.dispatchEvent(wheelEvent);

            // Should have zoomed out (scale < 2.0)
            expect(Zoom.getScale()).toBeLessThan(2.0);
        });

        it('should not zoom without Ctrl key', () => {
            const Zoom = window.Zoom;
            Zoom.setZoom(1.0);

            const wheelEvent = new WheelEvent('wheel', {
                deltaY: -100,
                ctrlKey: false,
                clientX: 500,
                clientY: 400
            });

            Zoom.initControls();
            canvasContainer.dispatchEvent(wheelEvent);

            // Should not have changed zoom
            expect(Zoom.getScale()).toBe(1.0);
        });
    });

    describe('getScale', () => {
        it('should return current scale', () => {
            const Zoom = window.Zoom;

            Zoom.setZoom(1.5);
            expect(Zoom.getScale()).toBe(1.5);

            Zoom.setZoom(0.5);
            expect(Zoom.getScale()).toBe(0.5);
        });
    });
});

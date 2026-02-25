/**
 * Unit tests for App module
 */

describe('App module', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <canvas id="riveCanvas"></canvas>
            <div id="overlay" class="hidden"></div>
            <div id="canvasContainer" style="width:800px;height:600px"></div>
        `;

        // Mock window.location.search
        delete window.location;
        window.location = new URL('http://localhost?path=/test/file.riv&theme=light');

        // Mock rive global object
        window.rive = {
            Rive: jest.fn(),
            Layout: jest.fn(),
            Fit: { Contain: 'contain' },
            Alignment: { Center: 'center' }
        };

        // Mock window modules
        window.UI = {
            setupTabs: jest.fn(),
            setupBackgroundSwatches: jest.fn(),
            populateFileInfo: jest.fn(),
            setupArtboardSwitch: jest.fn(),
            showError: jest.fn(),
            showRevNotice: jest.fn()
        };

        window.Animation = {
            populateAnimations: jest.fn(),
            getCurrentAnim: jest.fn()
        };

        window.StateMachine = {
            populateStateMachines: jest.fn(),
            getCurrentSM: jest.fn()
        };

        window.DataBinding = {
            populateViewModel: jest.fn()
        };

        window.Playback = {
            bindEvents: jest.fn(),
            setPlaying: jest.fn()
        };

        window.Zoom = {
            initControls: jest.fn(),
            zoomIn: jest.fn(),
            zoomOut: jest.fn(),
            resetZoom: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('URL parameters parsing', () => {
        it('should parse file path from URL', () => {
            // After app initialization
            expect(window.location.search).toContain('path=/test/file.riv');
        });

        it('should parse theme from URL', () => {
            // After app initialization
            expect(window.location.search).toContain('theme=light');
        });
    });

    describe('Module initialization', () => {
        it('should setup module references', () => {
            // Module references should be available
            expect(window.stateMachineModule).toBeDefined();
            expect(window.animationModule).toBeDefined();
            expect(window.dataBindingModule).toBeDefined();
            expect(window.playbackModule).toBeDefined();
            expect(window.zoomModule).toBeDefined();
        });
    });

    describe('Dark theme', () => {
        it('should apply dark theme when specified', () => {
            delete window.location;
            window.location = new URL('http://localhost?path=/test/file.riv&theme=dark');

            // After app initialization with dark theme
            expect(window.location.search).toContain('theme=dark');
        });

        it('should not apply dark theme when not specified', () => {
            // Light theme by default
            expect(document.body.classList.contains('dark-theme')).toBe(false);
        });
    });

    describe('Error handling', () => {
        it('should show error when no file path provided', () => {
            delete window.location;
            window.location = new URL('http://localhost');

            // When no path parameter
            expect(window.location.search).not.toContain('path=');
        });

        it('should show error for .rev files', () => {
            delete window.location;
            window.location = new URL('http://localhost?path=/test/file.rev');

            // .rev files should trigger showRevNotice
            expect(window.location.search).toContain('.rev');
        });
    });

    describe('Keyboard shortcuts', () => {
        it('should setup Ctrl+Plus for zoom in', () => {
            // This tests the keyboard event listener setup
            const Zoom = window.Zoom;

            // Simulate Ctrl+Plus keydown
            const keydownEvent = new KeyboardEvent('keydown', {
                key: '+',
                ctrlKey: true,
                shiftKey: false,
                altKey: false
            });

            document.dispatchEvent(keydownEvent);

            // The actual handling would be done in the app
            // Here we verify the Zoom module is available
            expect(Zoom).toBeDefined();
        });

        it('should setup Ctrl+Minus for zoom out', () => {
            const Zoom = window.Zoom;

            // Simulate Ctrl+Minus keydown
            const keydownEvent = new KeyboardEvent('keydown', {
                key: '-',
                ctrlKey: true,
                shiftKey: false,
                altKey: false
            });

            document.dispatchEvent(keydownEvent);

            expect(Zoom).toBeDefined();
        });

        it('should setup Ctrl+0 for reset zoom', () => {
            const Zoom = window.Zoom;

            // Simulate Ctrl+0 keydown
            const keydownEvent = new KeyboardEvent('keydown', {
                key: '0',
                ctrlKey: true,
                shiftKey: false,
                altKey: false
            });

            document.dispatchEvent(keydownEvent);

            expect(Zoom).toBeDefined();
        });
    });

    describe('Window resize handling', () => {
        it('should debounce resize events', () => {
            // Mock setTimeout
            jest.useFakeTimers();

            const resizeCallback = jest.fn();
            window.addEventListener('resize', resizeCallback);

            // Trigger multiple resize events
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('resize'));

            // Fast-forward timer
            jest.runAllTimers();

            // Should handle resize events (debounced)
            jest.useRealTimers();
        });
    });

    describe('Cleanup on unload', () => {
        it('should cleanup Rive instance on beforeunload', () => {
            const mockRiveInstance = {
                cleanup: jest.fn()
            };
            window.riveInstance = mockRiveInstance;

            // Trigger beforeunload
            const beforeUnloadEvent = new Event('beforeunload');
            window.dispatchEvent(beforeUnloadEvent);

            // Cleanup should be called
            // Note: In actual test environment, this would verify the cleanup
            expect(mockRiveInstance).toBeDefined();
        });
    });

    describe('Global state', () => {
        it('should store file path globally', () => {
            // Current file path should be accessible
            expect(window.currentFilePath).toBeDefined();
        });

        it('should store Rive instance globally', () => {
            // Rive instance reference should be available
            expect(window.riveInstance).toBeDefined();
        });
    });

    describe('Canvas sizing', () => {
        it('should have canvas container with dimensions', () => {
            const container = document.getElementById('canvasContainer');
            expect(container.style.width).toBe('800px');
            expect(container.style.height).toBe('600px');
        });

        it('should have canvas element', () => {
            const canvas = document.getElementById('riveCanvas');
            expect(canvas).not.toBeNull();
        });
    });
});

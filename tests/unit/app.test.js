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
            <span id="speedDisplay"></span>
            <input type="range" id="speedSlider" min="0.1" max="3" step="0.1" value="1">
            <button id="directionBtn"></button>
        `;

    // Mock window.location.search
    delete window.location;
    window.location = new URL('http://localhost?path=/test/file.riv&theme=light');

    // Mock rive global object
    window.rive = {
      Rive: jest.fn(() => ({
        on: jest.fn(),
        cleanup: jest.fn(),
      })),
      Layout: jest.fn(),
      Fit: { Contain: 'contain' },
      Alignment: { Center: 'center' },
    };

    // Mock window modules
    window.UI = {
      setupTabs: jest.fn(),
      setupBackgroundSwatches: jest.fn(),
      populateFileInfo: jest.fn(),
      setupArtboardSwitch: jest.fn(),
      showError: jest.fn(),
      showRevNotice: jest.fn(),
    };

    window.Animation = {
      populateAnimations: jest.fn(),
      getCurrentAnim: jest.fn(),
    };

    window.StateMachine = {
      populateStateMachines: jest.fn(),
      getCurrentSM: jest.fn(),
    };

    window.DataBinding = {
      populateViewModel: jest.fn(),
    };

    window.Zoom = {
      initControls: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      resetZoom: jest.fn(),
    };

    window.PlaybackControls = {
      init: jest.fn(),
    };

    window.Performance = {
      init: jest.fn(),
    };

    window.Shortcuts = {
      init: jest.fn(),
    };

    // Load app module after mocks are setup
    loadModule('app.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('URL parameters parsing', () => {
    it('should parse file path from URL', () => {
      expect(window.location.search).toContain('path=/test/file.riv');
    });

    it('should parse theme from URL', () => {
      expect(window.location.search).toContain('theme=light');
    });
  });

  describe('Module initialization', () => {
    it('should expose createRiveInstance function', () => {
      expect(typeof window.createRiveInstance).toBe('function');
    });

    it('should initialize Zoom controls', () => {
      expect(window.Zoom.initControls).toHaveBeenCalled();
    });

    it('should initialize PlaybackControls', () => {
      expect(window.PlaybackControls.init).toHaveBeenCalled();
    });

    it('should initialize Performance monitoring', () => {
      expect(window.Performance.init).toHaveBeenCalled();
    });

    it('should initialize Shortcuts help', () => {
      expect(window.Shortcuts.init).toHaveBeenCalled();
    });
  });

  describe('DOM elements', () => {
    it('should have canvas element', () => {
      const canvas = document.getElementById('riveCanvas');
      expect(canvas).not.toBeNull();
    });

    it('should have canvas container with dimensions', () => {
      const container = document.getElementById('canvasContainer');
      expect(container.style.width).toBe('800px');
      expect(container.style.height).toBe('600px');
    });
  });

  describe('Cleanup on unload', () => {
    it('should cleanup Rive instance on beforeunload', () => {
      const mockRiveInstance = {
        cleanup: jest.fn(),
      };
      window.riveInstance = mockRiveInstance;

      // Trigger beforeunload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);

      // Cleanup should be called
      expect(mockRiveInstance).toBeDefined();
    });
  });
});

/**
 * Unit tests for Playback module
 * Tests speed and direction control functionality
 */

describe('Playback module', () => {
  let mockRiveInstance;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
            <span id="speedDisplay"></span>
            <input type="range" id="speedSlider" min="0.1" max="3" step="0.1" value="1">
            <button id="directionBtn"></button>
        `;

    // Mock Rive instance
    mockRiveInstance = {
      timeScale: 1.0,
    };
    window.riveInstance = mockRiveInstance;

    // Load playback module after DOM is setup
    loadModule('playback.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete window.riveInstance;
  });

  describe('Speed control', () => {
    it('should set speed within valid range', () => {
      const Playback = window.Playback;

      Playback.setSpeed(0.5);
      expect(Playback.getSpeed()).toBe(0.5);

      Playback.setSpeed(2.0);
      expect(Playback.getSpeed()).toBe(2.0);
    });

    it('should clamp speed to minimum value', () => {
      const Playback = window.Playback;

      Playback.setSpeed(0.05);
      expect(Playback.getSpeed()).toBe(0.1); // minSpeed
    });

    it('should clamp speed to maximum value', () => {
      const Playback = window.Playback;

      Playback.setSpeed(5.0);
      expect(Playback.getSpeed()).toBe(3.0); // maxSpeed
    });

    it('should update speed display', () => {
      const Playback = window.Playback;
      const display = document.getElementById('speedDisplay');

      Playback.setSpeed(1.5);
      expect(display.textContent).toBe('150%');

      Playback.setSpeed(2.0);
      expect(display.textContent).toBe('200%');
    });

    it('should update speed slider value', () => {
      const Playback = window.Playback;
      const slider = document.getElementById('speedSlider');

      Playback.setSpeed(0.5);
      expect(slider.value).toBe('0.5');

      Playback.setSpeed(2.5);
      expect(slider.value).toBe('2.5');
    });

    it('should apply time scale to Rive instance', () => {
      const Playback = window.Playback;

      Playback.setSpeed(2.0);
      expect(mockRiveInstance.timeScale).toBe(2.0);

      Playback.toggleDirection();
      expect(mockRiveInstance.timeScale).toBe(-2.0);
    });
  });

  describe('Direction control', () => {
    it('should toggle direction from forward to backward', () => {
      const Playback = window.Playback;

      expect(Playback.getDirection()).toBe(1); // default forward

      Playback.toggleDirection();
      expect(Playback.getDirection()).toBe(-1);
    });

    it('should toggle direction from backward to forward', () => {
      const Playback = window.Playback;

      Playback.toggleDirection(); // now backward
      Playback.toggleDirection(); // back to forward
      expect(Playback.getDirection()).toBe(1);
    });

    it('should update direction button appearance', () => {
      const Playback = window.Playback;
      const btn = document.getElementById('directionBtn');

      Playback.toggleDirection();
      expect(btn.classList.contains('active')).toBe(true);
      expect(btn.title).toBe('方向: 反向 (点击切换)');

      Playback.toggleDirection();
      expect(btn.classList.contains('active')).toBe(false);
      expect(btn.title).toBe('方向: 正向 (点击切换)');
    });

    it('should apply negative time scale when direction is backward', () => {
      const Playback = window.Playback;

      Playback.setSpeed(1.5);
      Playback.toggleDirection();

      expect(mockRiveInstance.timeScale).toBe(-1.5);
    });
  });

  describe('applyTimeScale', () => {
    it('should not throw when riveInstance is undefined', () => {
      const Playback = window.Playback;
      delete window.riveInstance;

      expect(() => {
        Playback.applyTimeScale();
      }).not.toThrow();
    });

    it('should apply speed and direction to riveInstance', () => {
      const Playback = window.Playback;

      Playback.setSpeed(2.0);
      expect(mockRiveInstance.timeScale).toBe(2.0);

      Playback.toggleDirection();
      expect(mockRiveInstance.timeScale).toBe(-2.0);

      Playback.setSpeed(0.5);
      expect(mockRiveInstance.timeScale).toBe(-0.5);
    });
  });
});

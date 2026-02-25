/**
 * Unit tests for Playback module
 */

describe('Playback module', () => {
    let mockRiveInstance;
    let btnPlay, btnRestart, playLabel, icoPlay;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <button id="btnPlay">
                <span id="icoPlay"></span>
                <span id="playLabel"></span>
            </button>
            <button id="btnRestart"></button>
        `;

        btnPlay = document.getElementById('btnPlay');
        btnRestart = document.getElementById('btnRestart');
        playLabel = document.getElementById('playLabel');
        icoPlay = document.getElementById('icoPlay');

        // Mock Rive instance
        mockRiveInstance = {
            play: jest.fn(),
            pause: jest.fn(),
            reset: jest.fn()
        };

        // Mock window modules
        window.stateMachineModule = {
            getCurrentSM: jest.fn()
        };

        window.animationModule = {
            getCurrentAnim: jest.fn()
        };

        // Load playback module after DOM is setup
        loadModule('playback.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updatePlayIcon', () => {
        it('should show pause icon when playing', () => {
            const Playback = window.Playback;
            Playback.setPlaying(true);
            Playback.updatePlayIcon();

            expect(playLabel.textContent).toBe('暂停');
            expect(icoPlay.innerHTML).toContain('M6 4h4v16H6V4z');
            expect(icoPlay.innerHTML).toContain('M14 4h4v16h-4V4z');
        });

        it('should show play icon when paused', () => {
            const Playback = window.Playback;
            Playback.setPlaying(false);
            Playback.updatePlayIcon();

            expect(playLabel.textContent).toBe('播放');
            expect(icoPlay.innerHTML).toContain('M5 4l14 8-14 8V4z');
        });
    });

    describe('togglePlayPause', () => {
        it('should pause when playing', () => {
            const Playback = window.Playback;
            Playback.setPlaying(true);

            Playback.togglePlayPause(mockRiveInstance);

            expect(mockRiveInstance.pause).toHaveBeenCalled();
            expect(Playback.isPlaying()).toBe(false);
        });

        it('should play when paused with state machine', () => {
            const Playback = window.Playback;
            window.stateMachineModule.getCurrentSM.mockReturnValue('StateMachine1');
            Playback.setPlaying(false);

            Playback.togglePlayPause(mockRiveInstance);

            expect(mockRiveInstance.play).toHaveBeenCalledWith('StateMachine1');
            expect(Playback.isPlaying()).toBe(true);
        });

        it('should play when paused with animation', () => {
            const Playback = window.Playback;
            window.animationModule.getCurrentAnim.mockReturnValue('idle');
            window.stateMachineModule.getCurrentSM.mockReturnValue(null);
            Playback.setPlaying(false);

            Playback.togglePlayPause(mockRiveInstance);

            expect(mockRiveInstance.play).toHaveBeenCalledWith('idle');
            expect(Playback.isPlaying()).toBe(true);
        });

        it('should play default when no SM or anim', () => {
            const Playback = window.Playback;
            window.stateMachineModule.getCurrentSM.mockReturnValue(null);
            window.animationModule.getCurrentAnim.mockReturnValue(null);
            Playback.setPlaying(false);

            Playback.togglePlayPause(mockRiveInstance);

            expect(mockRiveInstance.play).toHaveBeenCalledWith();
            expect(Playback.isPlaying()).toBe(true);
        });

        it('should do nothing when riveInstance is null', () => {
            const Playback = window.Playback;
            Playback.setPlaying(true);

            Playback.togglePlayPause(null);

            expect(mockRiveInstance.pause).not.toHaveBeenCalled();
        });
    });

    describe('restart', () => {
        it('should restart with state machine', () => {
            const Playback = window.Playback;
            window.stateMachineModule.getCurrentSM.mockReturnValue('StateMachine1');
            window.stateMachineModule.loadSMInputs = jest.fn();

            Playback.restart(mockRiveInstance);

            expect(mockRiveInstance.reset).toHaveBeenCalled();
            expect(mockRiveInstance.play).toHaveBeenCalledWith('StateMachine1');
            expect(Playback.isPlaying()).toBe(true);
        });

        it('should restart with animation', () => {
            const Playback = window.Playback;
            window.animationModule.getCurrentAnim.mockReturnValue('idle');
            window.stateMachineModule.getCurrentSM.mockReturnValue(null);

            Playback.restart(mockRiveInstance);

            expect(mockRiveInstance.reset).toHaveBeenCalled();
            expect(mockRiveInstance.play).toHaveBeenCalledWith('idle');
            expect(Playback.isPlaying()).toBe(true);
        });

        it('should restart default when no SM or anim', () => {
            const Playback = window.Playback;
            window.stateMachineModule.getCurrentSM.mockReturnValue(null);
            window.animationModule.getCurrentAnim.mockReturnValue(null);

            Playback.restart(mockRiveInstance);

            expect(mockRiveInstance.reset).toHaveBeenCalled();
            expect(mockRiveInstance.play).toHaveBeenCalledWith();
            expect(Playback.isPlaying()).toBe(true);
        });
    });

    describe('setPlaying', () => {
        it('should set playing state', () => {
            const Playback = window.Playback;

            Playback.setPlaying(false);
            expect(Playback.isPlaying()).toBe(false);

            Playback.setPlaying(true);
            expect(Playback.isPlaying()).toBe(true);
        });
    });

    describe('isPlaying', () => {
        it('should return current playing state', () => {
            const Playback = window.Playback;

            Playback.setPlaying(true);
            expect(Playback.isPlaying()).toBe(true);

            Playback.setPlaying(false);
            expect(Playback.isPlaying()).toBe(false);
        });
    });

    describe('bindEvents', () => {
        it('should be callable without errors', () => {
            const Playback = window.Playback;

            // Just check it doesn't throw
            expect(() => {
                Playback.bindEvents(mockRiveInstance);
            }).not.toThrow();
        });
    });
});

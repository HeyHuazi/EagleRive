/**
 * Unit tests for Animation module
 */

describe('Animation module', () => {
    let mockRiveInstance;
    let animList;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="animList"></div>
        `;

        // Mock Rive instance
        mockRiveInstance = {
            animationNames: ['idle', 'walk', 'run'],
            play: jest.fn(),
            stop: jest.fn()
        };

        // Mock window.playbackModule
        window.playbackModule = {
            setPlaying: jest.fn()
        };

        // Load animation module after DOM is setup
        loadModule('animation.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('populateAnimations', () => {
        it('should populate animation list when animations exist', () => {
            const Animation = window.Animation;

            Animation.populateAnimations(mockRiveInstance);

            const list = document.getElementById('animList');
            expect(list.innerHTML).toContain('idle');
            expect(list.innerHTML).toContain('walk');
            expect(list.innerHTML).toContain('run');
        });

        it('should show empty message when no animations exist', () => {
            mockRiveInstance.animationNames = [];
            const Animation = window.Animation;

            Animation.populateAnimations(mockRiveInstance);

            const list = document.getElementById('animList');
            expect(list.innerHTML).toContain('暂无动画');
        });

        it('should set first animation as active', () => {
            const Animation = window.Animation;

            Animation.populateAnimations(mockRiveInstance);

            const list = document.getElementById('animList');
            const firstItem = list.querySelector('.item');
            expect(firstItem.classList.contains('active')).toBe(true);
            expect(Animation.getCurrentAnim()).toBe('idle');
        });

        it('should handle animation click events', () => {
            const Animation = window.Animation;

            Animation.populateAnimations(mockRiveInstance);

            const list = document.getElementById('animList');
            const secondItem = list.querySelectorAll('.item')[1];

            // Click on second animation
            secondItem.click();

            expect(Animation.getCurrentAnim()).toBe('walk');
            expect(mockRiveInstance.stop).toHaveBeenCalledWith('idle');
            expect(mockRiveInstance.play).toHaveBeenCalledWith('walk');
            expect(window.playbackModule.setPlaying).toHaveBeenCalledWith(true);
        });
    });

    describe('playAnim', () => {
        it('should play animation by name', () => {
            const Animation = window.Animation;

            Animation.playAnim(mockRiveInstance, 'run');

            expect(mockRiveInstance.play).toHaveBeenCalledWith('run');
            expect(window.playbackModule.setPlaying).toHaveBeenCalledWith(true);
        });

        it('should not play when name is null', () => {
            const Animation = window.Animation;

            Animation.playAnim(mockRiveInstance, null);

            expect(mockRiveInstance.play).not.toHaveBeenCalled();
        });

        it('should not play when name is undefined', () => {
            const Animation = window.Animation;

            Animation.playAnim(mockRiveInstance, undefined);

            expect(mockRiveInstance.play).not.toHaveBeenCalled();
        });
    });

    describe('getCurrentAnim', () => {
        it('should return current animation', () => {
            const Animation = window.Animation;

            Animation.populateAnimations(mockRiveInstance);

            expect(Animation.getCurrentAnim()).toBe('idle');
        });

        it('should return null when no animation is set', () => {
            const Animation = window.Animation;

            Animation.setCurrentAnim(null);

            expect(Animation.getCurrentAnim()).toBeNull();
        });
    });

    describe('setCurrentAnim', () => {
        it('should set current animation', () => {
            const Animation = window.Animation;

            Animation.setCurrentAnim('walk');

            expect(Animation.getCurrentAnim()).toBe('walk');
        });
    });
});

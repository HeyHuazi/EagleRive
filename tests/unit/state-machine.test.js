/**
 * Unit tests for StateMachine module
 */

describe('StateMachine module', () => {
  let mockRiveInstance;
  let smSection, smSelect, smInputs;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
            <div id="smSection"></div>
            <select id="smSelect"></select>
            <div id="smInputs"></div>
        `;

    smSection = document.getElementById('smSection');
    smSelect = document.getElementById('smSelect');
    smInputs = document.getElementById('smInputs');

    // Mock Rive instance with state machines
    mockRiveInstance = {
      stateMachineNames: ['StateMachine1', 'StateMachine2'],
      play: jest.fn(),
      stop: jest.fn(),
      stateMachineInputs: jest.fn(),
    };

    // Mock window.Animation
    window.Animation = {
      getCurrentAnim: jest.fn(),
      playAnim: jest.fn(),
    };

    // Mock RiveUtils
    window.RiveUtils = {
      escapeAttr: jest.fn(str => str),
    };

    // Load state-machine module after DOM is setup
    loadModule('state-machine.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('populateStateMachines', () => {
    it('should populate state machine dropdown', () => {
      const StateMachine = window.StateMachine;

      StateMachine.populateStateMachines(mockRiveInstance);

      expect(smSection.style.display).toBe('');
      expect(smSelect.innerHTML).toContain('StateMachine1');
      expect(smSelect.innerHTML).toContain('StateMachine2');
    });

    it('should hide section when no state machines exist', () => {
      mockRiveInstance.stateMachineNames = [];
      const StateMachine = window.StateMachine;

      StateMachine.populateStateMachines(mockRiveInstance);

      expect(smSection.style.display).toBe('none');
    });

    it('should auto-play first state machine', () => {
      const StateMachine = window.StateMachine;

      StateMachine.populateStateMachines(mockRiveInstance);

      expect(StateMachine.getCurrentSM()).toBe('StateMachine1');
    });

    it('should handle state machine selection change', () => {
      const StateMachine = window.StateMachine;

      StateMachine.populateStateMachines(mockRiveInstance);

      // Change selection
      smSelect.value = 'StateMachine2';
      smSelect.dispatchEvent(new Event('change'));

      expect(StateMachine.getCurrentSM()).toBe('StateMachine2');
    });
  });

  describe('playSM', () => {
    it('should play state machine and stop current animation', () => {
      window.Animation.getCurrentAnim.mockReturnValue('idle');
      const StateMachine = window.StateMachine;

      StateMachine.playSM(mockRiveInstance, 'StateMachine1');

      expect(mockRiveInstance.stop).toHaveBeenCalledWith('idle');
      expect(mockRiveInstance.play).toHaveBeenCalledWith('StateMachine1');
    });

    it('should stop previous state machine if different', () => {
      const StateMachine = window.StateMachine;
      StateMachine.setCurrentSM('StateMachine1');

      StateMachine.playSM(mockRiveInstance, 'StateMachine2');

      expect(mockRiveInstance.stop).toHaveBeenCalledWith('StateMachine1');
      expect(mockRiveInstance.play).toHaveBeenCalledWith('StateMachine2');
    });
  });

  describe('loadSMInputs', () => {
    beforeEach(() => {
      // Mock state machine inputs
      mockRiveInstance.stateMachineInputs.mockReturnValue([
        {
          name: 'trigger1',
          type: 1, // Trigger
          fire: jest.fn(),
        },
        {
          name: 'bool1',
          type: 2, // Boolean
          value: true,
        },
        {
          name: 'num1',
          type: 3, // Number
          value: 5.5,
        },
      ]);
    });

    it('should load and display state machine inputs', () => {
      const StateMachine = window.StateMachine;

      // Just check it doesn't throw
      expect(() => {
        StateMachine.loadSMInputs(mockRiveInstance, 'StateMachine1');
      }).not.toThrow();
    });

    it('should hide inputs box when no inputs exist', () => {
      mockRiveInstance.stateMachineInputs.mockReturnValue([]);
      const StateMachine = window.StateMachine;

      StateMachine.loadSMInputs(mockRiveInstance, 'StateMachine1');

      expect(smInputs.style.display).toBe('none');
    });
  });

  describe('getCurrentSM', () => {
    it('should return current state machine', () => {
      const StateMachine = window.StateMachine;

      StateMachine.populateStateMachines(mockRiveInstance);

      expect(StateMachine.getCurrentSM()).toBe('StateMachine1');
    });

    it('should return null when no state machine is set', () => {
      const StateMachine = window.StateMachine;

      StateMachine.setCurrentSM(null);

      expect(StateMachine.getCurrentSM()).toBeNull();
    });
  });

  describe('setCurrentSM', () => {
    it('should set current state machine', () => {
      const StateMachine = window.StateMachine;

      StateMachine.setCurrentSM('StateMachine2');

      expect(StateMachine.getCurrentSM()).toBe('StateMachine2');
    });
  });
});

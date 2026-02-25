/**
 * Unit tests for UI module
 */

describe('UI module', () => {
    let mockRiveInstance;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div class="sidebar-tab" data-tab="timeline"></div>
            <div class="sidebar-tab" data-tab="statemachine"></div>
            <div class="panel" id="panel-timeline"></div>
            <div class="panel" id="panel-statemachine"></div>
            <div class="bg-swatch" data-bg="checker"></div>
            <div class="bg-swatch" data-bg="white"></div>
            <div class="bg-swatch" data-bg="black"></div>
            <div id="canvasContainer"></div>
            <div id="artboardRow" style="display:none">
                <select id="artboardSelect"></select>
            </div>
            <div id="fileName"></div>
            <div id="infoDims"></div>
            <div id="infoAnimCount"></div>
            <div id="infoSMCount"></div>
            <div id="infoVMCount"></div>
            <div id="overlay"></div>
        `;

        // Mock Rive instance
        mockRiveInstance = {
            artboardNames: ['Artboard1', 'Artboard2'],
            bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
            animationNames: ['idle', 'walk'],
            stateMachineNames: ['StateMachine1'],
            viewModelCount: 1
        };

        // Mock window modules
        window.stateMachineModule = {
            getCurrentSM: jest.fn(),
            playSM: jest.fn(),
            setCurrentSM: jest.fn()
        };

        window.animationModule = {
            getCurrentAnim: jest.fn(),
            playAnim: jest.fn(),
            setCurrentAnim: jest.fn()
        };

        window.dataBindingModule = {
            populateViewModel: jest.fn()
        };

        // Mock current file path
        window.currentFilePath = '/path/to/file.riv';

        // Load UI module after DOM is setup
        loadModule('ui.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setupTabs', () => {
        it('should setup tab click handlers', () => {
            const UI = window.UI;
            UI.setupTabs(mockRiveInstance);

            const timelineTab = document.querySelector('.sidebar-tab[data-tab="timeline"]');
            const smTab = document.querySelector('.sidebar-tab[data-tab="statemachine"]');

            expect(timelineTab).not.toBeNull();
            expect(smTab).not.toBeNull();
        });

        it('should activate tab on click', () => {
            const UI = window.UI;
            UI.setupTabs(mockRiveInstance);

            const timelineTab = document.querySelector('.sidebar-tab[data-tab="timeline"]');
            timelineTab.click();

            expect(timelineTab.classList.contains('active')).toBe(true);
            expect(document.getElementById('panel-timeline').classList.contains('active')).toBe(true);
        });

        it('should switch to state machine tab and play SM', () => {
            window.stateMachineModule.getCurrentSM.mockReturnValue('StateMachine1');
            const UI = window.UI;
            UI.setupTabs(mockRiveInstance);

            const smTab = document.querySelector('.sidebar-tab[data-tab="statemachine"]');
            smTab.click();

            expect(window.stateMachineModule.playSM).toHaveBeenCalledWith(mockRiveInstance, 'StateMachine1');
        });
    });

    describe('setupBackgroundSwatches', () => {
        it('should setup background swatch click handlers', () => {
            const UI = window.UI;
            UI.setupBackgroundSwatches();

            const checkerSwatch = document.querySelector('.bg-swatch[data-bg="checker"]');
            expect(checkerSwatch).not.toBeNull();
        });

        it('should apply checker background on click', () => {
            const UI = window.UI;
            UI.setupBackgroundSwatches();

            const checkerSwatch = document.querySelector('.bg-swatch[data-bg="checker"]');
            const container = document.getElementById('canvasContainer');

            checkerSwatch.click();

            expect(checkerSwatch.classList.contains('active')).toBe(true);
            expect(container.classList.contains('bg-checker')).toBe(true);
        });

        it('should apply white background on click', () => {
            const UI = window.UI;
            UI.setupBackgroundSwatches();

            const whiteSwatch = document.querySelector('.bg-swatch[data-bg="white"]');
            const container = document.getElementById('canvasContainer');

            whiteSwatch.click();

            expect(whiteSwatch.classList.contains('active')).toBe(true);
            expect(container.classList.contains('bg-white')).toBe(true);
        });

        it('should apply black background on click', () => {
            const UI = window.UI;
            UI.setupBackgroundSwatches();

            const blackSwatch = document.querySelector('.bg-swatch[data-bg="black"]');
            const container = document.getElementById('canvasContainer');

            blackSwatch.click();

            expect(blackSwatch.classList.contains('active')).toBe(true);
            expect(container.classList.contains('bg-black')).toBe(true);
        });
    });

    describe('setupArtboardSwitch', () => {
        it('should hide artboard row when only one artboard', () => {
            mockRiveInstance.artboardNames = ['Artboard1'];
            const UI = window.UI;

            UI.setupArtboardSwitch(mockRiveInstance);

            const artboardRow = document.getElementById('artboardRow');
            expect(artboardRow.style.display).toBe('none');
        });

        it('should show artboard row when multiple artboards exist', () => {
            const UI = window.UI;

            UI.setupArtboardSwitch(mockRiveInstance);

            const artboardRow = document.getElementById('artboardRow');
            expect(artboardRow.style.display).toBe('');
        });

        it('should populate artboard select dropdown', () => {
            const UI = window.UI;

            UI.setupArtboardSwitch(mockRiveInstance);

            const artboardSelect = document.getElementById('artboardSelect');
            expect(artboardSelect.innerHTML).toContain('Artboard1');
            expect(artboardSelect.innerHTML).toContain('Artboard2');
        });
    });

    describe('populateFileInfo', () => {
        it('should populate file name', () => {
            const UI = window.UI;

            UI.populateFileInfo(mockRiveInstance);

            const fileName = document.getElementById('fileName');
            expect(fileName.textContent).toBe('file.riv');
        });

        it('should populate dimensions', () => {
            const UI = window.UI;

            UI.populateFileInfo(mockRiveInstance);

            const infoDims = document.getElementById('infoDims');
            expect(infoDims.textContent).toBe('100 × 100');
        });

        it('should populate animation count', () => {
            const UI = window.UI;

            UI.populateFileInfo(mockRiveInstance);

            const infoAnimCount = document.getElementById('infoAnimCount');
            expect(infoAnimCount.textContent).toBe('2');
        });

        it('should populate state machine count', () => {
            const UI = window.UI;

            UI.populateFileInfo(mockRiveInstance);

            const infoSMCount = document.getElementById('infoSMCount');
            expect(infoSMCount.textContent).toBe('1');
        });

        it('should populate ViewModel count', () => {
            const UI = window.UI;

            UI.populateFileInfo(mockRiveInstance);

            const infoVMCount = document.getElementById('infoVMCount');
            expect(infoVMCount.textContent).toBe('1');
        });

        it('should handle missing bounds', () => {
            mockRiveInstance.bounds = null;
            const UI = window.UI;

            UI.populateFileInfo(mockRiveInstance);

            const infoDims = document.getElementById('infoDims');
            expect(infoDims.textContent).toBe('-');
        });
    });

    describe('showError', () => {
        it('should display error message', () => {
            const UI = window.UI;

            UI.showError('Test error message');

            const overlay = document.getElementById('overlay');
            expect(overlay.innerHTML).toContain('Test error message');
            expect(overlay.innerHTML).toContain('error-msg');
        });
    });

    describe('showRevNotice', () => {
        it('should display .rev file notice', () => {
            const UI = window.UI;

            UI.showRevNotice();

            const overlay = document.getElementById('overlay');
            expect(overlay.innerHTML).toContain('.REV 文件');
            expect(overlay.innerHTML).toContain('Rive 编辑器备份文件');
            expect(overlay.innerHTML).toContain('Rive 编辑器');
        });

        it('should hide timeline tab for .rev files', () => {
            const UI = window.UI;

            UI.showRevNotice();

            const timelineTab = document.querySelector('.sidebar-tab[data-tab="timeline"]');
            expect(timelineTab.style.display).toBe('none');
        });

        it('should populate file name', () => {
            const UI = window.UI;

            UI.showRevNotice();

            const fileName = document.getElementById('fileName');
            expect(fileName.textContent).toBe('file.riv');
        });
    });
});

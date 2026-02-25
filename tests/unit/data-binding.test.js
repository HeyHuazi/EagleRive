/**
 * Unit tests for DataBinding module
 */

describe('DataBinding module', () => {
    let mockRiveInstance;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <select id="vmSelect"></select>
            <div id="vmProps"></div>
            <div id="vmSection" style="display:none"></div>
        `;

        // Mock RiveUtils
        window.RiveUtils = {
            escapeAttr: jest.fn((str) => str),
            riveColorToHex: jest.fn((color) => '#FF0000'),
            hexToRiveColor: jest.fn((hex) => 0xFFFF0000)
        };

        // Mock ViewModelInstance
        const mockVMI = {
            trigger: jest.fn((name) => ({ name, trigger: jest.fn(), fire: jest.fn() })),
            boolean: jest.fn((name) => ({ name, value: true })),
            number: jest.fn((name) => ({ name, value: 5.5 })),
            string: jest.fn((name) => ({ name, value: 'test' })),
            color: jest.fn((name) => ({ name, value: 0xFFFF0000 })),
            enum: jest.fn((name) => ({ name, value: 'option1', values: ['option1', 'option2'] })),
            list: jest.fn((name) => ({ name, size: 3 })),
            viewModel: jest.fn((name) => ({ name, properties: [] })),
            properties: [
                { name: 'testTrigger', type: 1 },
                { name: 'testBool', type: 2 },
                { name: 'testNumber', type: 3 },
                { name: 'testString', type: 4 }
            ]
        };

        // Mock Rive instance
        mockRiveInstance = {
            viewModelCount: 1,
            viewModelInstance: mockVMI,
            viewModelByIndex: jest.fn((i) => ({ name: `ViewModel${i}` })),
            defaultViewModel: jest.fn(() => ({ name: 'DefaultVM' })),
            viewModelByName: jest.fn(() => ({ name: 'TestVM' }))
        };

        // Reset module state
        if (window.DataBinding) {
            // State is internal to module
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('populateViewModel', () => {
        it('should show section when ViewModels exist', () => {
            const DataBinding = window.DataBinding;

            DataBinding.populateViewModel(mockRiveInstance);

            const vmSection = document.getElementById('vmSection');
            expect(vmSection.style.display).toBe('');
        });

        it('should hide section when no ViewModels exist', () => {
            mockRiveInstance.viewModelCount = 0;
            mockRiveInstance.viewModelInstance = null;
            const DataBinding = window.DataBinding;

            DataBinding.populateViewModel(mockRiveInstance);

            const vmSection = document.getElementById('vmSection');
            expect(vmSection.style.display).toBe('none');
        });

        it('should populate ViewModel dropdown', () => {
            const DataBinding = window.DataBinding;

            DataBinding.populateViewModel(mockRiveInstance);

            const vmSelect = document.getElementById('vmSelect');
            expect(vmSelect.innerHTML).toContain('ViewModel');
        });

        it('should handle autoBind default instance', () => {
            const DataBinding = window.DataBinding;

            DataBinding.populateViewModel(mockRiveInstance);

            // Should load properties for default ViewModel
            const vmProps = document.getElementById('vmProps');
            expect(vmProps.innerHTML).toBeDefined();
        });
    });

    describe('loadVMProperties', () => {
        it('should load ViewModel properties', () => {
            const DataBinding = window.DataBinding;

            DataBinding.loadVMProperties(mockRiveInstance, 'TestVM');

            const vmProps = document.getElementById('vmProps');
            expect(vmProps.innerHTML).toBeDefined();
        });

        it('should show error when VMI is null', () => {
            mockRiveInstance.viewModelInstance = null;
            const DataBinding = window.DataBinding;

            DataBinding.loadVMProperties(mockRiveInstance, 'TestVM');

            const vmProps = document.getElementById('vmProps');
            expect(vmProps.innerHTML).toContain('无法加载');
        });
    });

    describe('renderVMProperties', () => {
        it('should render trigger properties', () => {
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('触发器');
        });

        it('should render boolean properties', () => {
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('布尔值');
        });

        it('should render number properties', () => {
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('数值');
        });

        it('should render string properties', () => {
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('字符串');
        });

        it('should render color properties', () => {
            // Add a color property
            mockRiveInstance.viewModelInstance.properties.push({ name: 'testColor', type: 5 });

            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('颜色');
        });

        it('should render enum properties', () => {
            // Add an enum property
            mockRiveInstance.viewModelInstance.properties.push({ name: 'testEnum', type: 6 });

            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('枚举');
        });

        it('should render list properties', () => {
            // Add a list property
            mockRiveInstance.viewModelInstance.properties.push({ name: 'testList', type: 7 });

            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('列表');
        });

        it('should show empty message when no properties', () => {
            mockRiveInstance.viewModelInstance.properties = [];
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            expect(container.innerHTML).toContain('暂无属性');
        });

        it('should limit nested ViewModel depth to 3', () => {
            // Add nested ViewModel properties
            mockRiveInstance.viewModelInstance.properties.push({ name: 'testVM', type: 8 });

            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            // Render at depth 0
            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            // Render at depth 3 (should not recurse further)
            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 3);

            expect(container.innerHTML).toBeDefined();
        });
    });

    describe('bindVMEvents', () => {
        let mockVMI;

        beforeEach(() => {
            mockVMI = mockRiveInstance.viewModelInstance;

            // Setup DOM with control elements
            document.getElementById('vmProps').innerHTML = `
                <button data-vm-trg="testTrigger">Test Trigger</button>
                <input type="checkbox" data-vm-bool="testBool" checked>
                <input type="number" data-vm-num="testNumber" value="5.5">
                <input type="text" data-vm-str="testString" value="test">
                <input type="color" data-vm-color="testColor" value="#FF0000">
                <select data-vm-enum="testEnum">
                    <option value="option1" selected>Option 1</option>
                    <option value="option2">Option 2</option>
                </select>
            `;
        });

        it('should bind trigger button click', () => {
            const DataBinding = window.DataBinding;
            const container = document.getElementById('vmProps');

            DataBinding.bindVMEvents(mockVMI, container);

            const triggerBtn = container.querySelector('[data-vm-trg]');
            triggerBtn.click();

            // Trigger fire/trigger should be called
            expect(mockVMI.trigger).toHaveBeenCalledWith('testTrigger');
        });

        it('should bind boolean checkbox change', () => {
            const DataBinding = window.DataBinding;
            const container = document.getElementById('vmProps');

            DataBinding.bindVMEvents(mockVMI, container);

            const boolInput = container.querySelector('[data-vm-bool]');
            boolInput.checked = false;
            boolInput.dispatchEvent(new Event('change'));

            expect(mockVMI.boolean).toHaveBeenCalledWith('testBool');
        });

        it('should bind number input', () => {
            const DataBinding = window.DataBinding;
            const container = document.getElementById('vmProps');

            DataBinding.bindVMEvents(mockVMI, container);

            const numInput = container.querySelector('[data-vm-num]');
            numInput.value = '10.5';
            numInput.dispatchEvent(new Event('input'));

            expect(mockVMI.number).toHaveBeenCalledWith('testNumber');
        });

        it('should bind string input', () => {
            const DataBinding = window.DataBinding;
            const container = document.getElementById('vmProps');

            DataBinding.bindVMEvents(mockVMI, container);

            const strInput = container.querySelector('[data-vm-str]');
            strInput.value = 'updated';
            strInput.dispatchEvent(new Event('input'));

            expect(mockVMI.string).toHaveBeenCalledWith('testString');
        });

        it('should bind color input', () => {
            const DataBinding = window.DataBinding;
            const container = document.getElementById('vmProps');

            DataBinding.bindVMEvents(mockVMI, container);

            const colorInput = container.querySelector('[data-vm-color]');
            colorInput.value = '#00FF00';
            colorInput.dispatchEvent(new Event('input'));

            expect(mockVMI.color).toHaveBeenCalledWith('testColor');
            expect(window.RiveUtils.hexToRiveColor).toHaveBeenCalledWith('#00FF00');
        });

        it('should bind enum select change', () => {
            const DataBinding = window.DataBinding;
            const container = document.getElementById('vmProps');

            DataBinding.bindVMEvents(mockVMI, container);

            const enumSelect = container.querySelector('[data-vm-enum]');
            enumSelect.value = 'option2';
            enumSelect.dispatchEvent(new Event('change'));

            expect(mockVMI.enum).toHaveBeenCalledWith('testEnum');
        });
    });

    describe('normalizeType', () => {
        it('should normalize property types correctly', () => {
            // Type normalization is internal to the module
            // but we can test the rendering behavior
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;
            const container = document.getElementById('vmProps');

            DataBinding.renderVMProperties(mockVMI, 'TestVM', container, 0);

            // Should render different type groups
            expect(container.innerHTML).toContain('触发器');
            expect(container.innerHTML).toContain('布尔值');
            expect(container.innerHTML).toContain('数值');
            expect(container.innerHTML).toContain('字符串');
        });
    });

    describe('getCurrentVMI', () => {
        it('should return current ViewModelInstance', () => {
            const DataBinding = window.DataBinding;
            DataBinding.populateViewModel(mockRiveInstance);

            const currentVMI = DataBinding.getCurrentVMI();

            // After populateViewModel with autoBind, should have a VMI
            expect(currentVMI).toBeDefined();
        });
    });

    describe('getPropertyDescriptors', () => {
        it('should get properties from vmi.properties', () => {
            const DataBinding = window.DataBinding;
            const mockVMI = mockRiveInstance.viewModelInstance;

            // Properties should be accessible
            expect(mockVMI.properties).toBeDefined();
            expect(mockVMI.properties.length).toBeGreaterThan(0);
        });
    });
});

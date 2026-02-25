/**
 * Unit tests for utility functions
 */

const { RiveUtils, DataType, PropertyType, normalizeType } = require('../../viewer/js/utils.js');

describe('RiveUtils', () => {
    describe('escapeAttr', () => {
        test('should escape HTML special characters', () => {
            // escapeAttr only escapes &, ", and < (not >)
            expect(RiveUtils.escapeAttr('<script>')).toBe('&lt;script>');
            expect(RiveUtils.escapeAttr('"hello"')).toBe('&quot;hello&quot;');
            expect(RiveUtils.escapeAttr('a&b')).toBe('a&amp;b');
        });

        test('should handle empty strings', () => {
            expect(RiveUtils.escapeAttr('')).toBe('');
        });

        test('should handle strings without special characters', () => {
            expect(RiveUtils.escapeAttr('hello world')).toBe('hello world');
        });
    });

    describe('riveColorToHex', () => {
        test('should convert Rive color number to hex string', () => {
            // Opaque red (0xFFFF0000)
            expect(RiveUtils.riveColorToHex(0xFFFF0000)).toBe('#ff0000');
            // Opaque green (0xFF00FF00)
            expect(RiveUtils.riveColorToHex(0xFF00FF00)).toBe('#00ff00');
            // Opaque blue (0xFF0000FF)
            expect(RiveUtils.riveColorToHex(0xFF0000FF)).toBe('#0000ff');
            // White (0xFFFFFFFF)
            expect(RiveUtils.riveColorToHex(0xFFFFFFFF)).toBe('#ffffff');
            // Black (0xFF000000)
            expect(RiveUtils.riveColorToHex(0xFF000000)).toBe('#000000');
        });

        test('should handle negative numbers (two\'s complement)', () => {
            // Test with negative representation
            // -256 in two's complement is 0xFFFFFF00, which gives #ffff00
            expect(RiveUtils.riveColorToHex(-256)).toBe('#ffff00');
        });
    });

    describe('hexToRiveColor', () => {
        test('should convert hex string to Rive color number', () => {
            expect(RiveUtils.hexToRiveColor('#ff0000')).toBe(0xFFFF0000 >>> 0);
            expect(RiveUtils.hexToRiveColor('#00ff00')).toBe(0xFF00FF00 >>> 0);
            expect(RiveUtils.hexToRiveColor('#0000ff')).toBe(0xFF0000FF >>> 0);
            expect(RiveUtils.hexToRiveColor('#ffffff')).toBe(0xFFFFFFFF >>> 0);
            expect(RiveUtils.hexToRiveColor('#000000')).toBe(0xFF000000 >>> 0);
        });

        test('should handle hex without # prefix', () => {
            expect(RiveUtils.hexToRiveColor('ff0000')).toBe(0xFFFF0000 >>> 0);
        });

        test('should handle short hex format', () => {
            // #f00 -> 'f00' -> parseInt = 3840 = 0xF00 -> 0xFF000000 | 0xF00 = 0xFF000F00 = 4278193920
            expect(RiveUtils.hexToRiveColor('#f00')).toBe(4278193920);
        });
    });

    describe('color conversion roundtrip', () => {
        test('should maintain color values through roundtrip conversion', () => {
            const colors = [
                0xFFFF0000, // Red
                0xFF00FF00, // Green
                0xFF0000FF, // Blue
                0xFFFFFFFF, // White
                0xFF000000, // Black
                0xFFFFFF00, // Yellow
                0xFFFF00FF, // Magenta
                0xFF00FFFF, // Cyan
            ];

            colors.forEach(color => {
                const hex = RiveUtils.riveColorToHex(color);
                const converted = RiveUtils.hexToRiveColor(hex);
                expect(converted).toBe(color);
            });
        });
    });
});

describe('normalizeType', () => {
    describe('numeric enum types', () => {
        test('should normalize WASM DataType enum values', () => {
            expect(normalizeType(DataType.trigger)).toBe('trigger');
            expect(normalizeType(DataType.boolean)).toBe('boolean');
            expect(normalizeType(DataType.number)).toBe('number');
            expect(normalizeType(DataType.string)).toBe('string');
            expect(normalizeType(DataType.color)).toBe('color');
            expect(normalizeType(DataType.list)).toBe('list');
            expect(normalizeType(DataType.enumType)).toBe('enum');
            expect(normalizeType(DataType.viewModel)).toBe('viewModel');
        });

        test('should handle unknown numeric types', () => {
            expect(normalizeType(999)).toBe('unknown-999');
        });
    });

    describe('string type names', () => {
        test('should normalize string type names', () => {
            expect(normalizeType('trigger')).toBe('trigger');
            expect(normalizeType('boolean')).toBe('boolean');
            expect(normalizeType('number')).toBe('number');
            expect(normalizeType('string')).toBe('string');
            expect(normalizeType('color')).toBe('color');
            expect(normalizeType('list')).toBe('list');
            expect(normalizeType('enum')).toBe('enum');
            expect(normalizeType('enumType')).toBe('enum');
            expect(normalizeType('viewModel')).toBe('viewModel');
            expect(normalizeType('viewmodel')).toBe('viewModel');
        });

        test('should handle case insensitivity', () => {
            expect(normalizeType('Trigger')).toBe('trigger');
            expect(normalizeType('BOOLEAN')).toBe('boolean');
            expect(normalizeType('Number')).toBe('number');
        });

        test('should return lowercase string for unrecognized types', () => {
            expect(normalizeType('unknownType')).toBe('unknowntype');
            expect(normalizeType('')).toBe(''); // Empty string returns empty string
        });
    });
});

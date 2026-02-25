/**
 * Utility functions for Rive viewer
 */

const RiveUtils = {
    /**
     * Escape HTML attribute values
     */
    escapeAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    },

    /**
     * Convert Rive color number to hex string
     */
    riveColorToHex(c) {
        const n = (c < 0 ? c + 0x100000000 : c) >>> 0;
        const r = (n >> 16) & 0xFF;
        const g = (n >> 8) & 0xFF;
        const b = n & 0xFF;
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    },

    /**
     * Convert hex string to Rive color number
     */
    hexToRiveColor(hex) {
        hex = hex.replace('#', '');
        const n = parseInt(hex, 16);
        return (0xFF000000 | n) >>> 0;
    }
};

// WASM DataType enum values
const DataType = {
    none: 0,
    string: 1,
    number: 2,
    boolean: 3,
    color: 4,
    list: 5,
    enumType: 6,
    trigger: 7,
    viewModel: 8
};

// High-level PropertyType string enum
const PropertyType = {
    number: 'number',
    string: 'string',
    boolean: 'boolean',
    color: 'color',
    trigger: 'trigger',
    enum: 'enum',
    list: 'list',
    image: 'image',
    artboard: 'artboard'
};

/**
 * Normalize property type to unified string category
 * Supports both WASM numeric enums and high-level API string enums
 */
function normalizeType(t) {
    if (typeof t === 'number') {
        switch (t) {
            case DataType.trigger: return 'trigger';
            case DataType.boolean: return 'boolean';
            case DataType.number: return 'number';
            case DataType.string: return 'string';
            case DataType.color: return 'color';
            case DataType.list: return 'list';
            case DataType.enumType: return 'enum';
            case DataType.viewModel: return 'viewModel';
            default: return 'unknown-' + t;
        }
    }
    if (typeof t === 'string') {
        const s = t.toLowerCase();
        if (s === 'enum' || s === 'enumtype') return 'enum';
        if (s === 'viewmodel') return 'viewModel';
        return s;
    }
    return 'unknown';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RiveUtils, DataType, PropertyType, normalizeType };
}

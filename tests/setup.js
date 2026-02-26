/**
 * Jest setup file
 * This file is executed before all tests
 */

// Set up any global test utilities here

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Mock fetch API for loading files
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Load Rive utility module first
const fs = require('fs');
const path = require('path');

// Set up global window object if not exists
if (typeof global.window === 'undefined') global.window = global;

// Load utils module (has exports)
const utils = require('../viewer/js/utils.js');

// Expose utils to global scope for other modules
global.RiveUtils = utils.RiveUtils;
global.DataType = utils.DataType;
global.PropertyType = utils.PropertyType;
global.normalizeType = utils.normalizeType;

// Helper function to load a module after DOM is setup
global.loadModule = function (moduleName) {
  const modulesDir = path.resolve(__dirname, '../viewer/js');
  const filePath = path.join(modulesDir, moduleName);
  const code = fs.readFileSync(filePath, 'utf8');
  eval(code);
};

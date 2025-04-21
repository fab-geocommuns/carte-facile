/**
 * Test suite for the UMD bundle
 * These tests verify that the UMD bundle is correctly built and exposes the expected API
 * They run in a simulated browser environment using JSDOM
 */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { MapStyle, MapThumbnails } from '../src/map/types';

// Test configuration
const TEST_TIMEOUT = 10000;
const SCRIPT_LOAD_DELAY = 100;
const BUNDLE_PATH = path.resolve(__dirname, '../dist/carte-facile.js');

// Type definitions for the test environment
interface MockMapLibre {
  Map: jest.Mock;
  NavigationControl: jest.Mock;
  ScaleControl: jest.Mock;
}

interface CarteFacile {
  mapStyle: MapStyle;
  mapThumbnails: MapThumbnails;
}

interface WindowWithCarteFacile extends Window {
  CarteFacile: CarteFacile;
  maplibregl: MockMapLibre;
}

/**
 * Creates a JSDOM environment with the necessary setup for testing the UMD bundle
 * This includes:
 * - Basic HTML structure
 * - Mocked maplibre-gl objects
 * - Script execution capabilities
 */
function createTestEnvironment() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div id="map"></div>
      </body>
    </html>
  `, {
    runScripts: 'dangerously',
    resources: 'usable',
  });

  const window = dom.window as unknown as WindowWithCarteFacile;
  const document = window.document;

  // Mock maplibre-gl
  window.maplibregl = {
    Map: jest.fn(),
    NavigationControl: jest.fn(),
    ScaleControl: jest.fn(),
  };

  return { window, document };
}

describe('UMD Bundle', () => {
  let window: WindowWithCarteFacile;
  let document: Document;
  let CarteFacile: CarteFacile;

  // Setup test environment and load the UMD bundle
  beforeAll((done) => {
    try {
      // Setup test environment
      const env = createTestEnvironment();
      window = env.window;
      document = env.document;

      // Load and execute the UMD bundle
      const bundleCode = fs.readFileSync(BUNDLE_PATH, 'utf8');
      const script = document.createElement('script');
      script.textContent = bundleCode;
      document.body.appendChild(script);

      // Wait for the script to execute
      setTimeout(() => {
        CarteFacile = window.CarteFacile;
        done();
      }, SCRIPT_LOAD_DELAY);
    } catch (error) {
      done(error);
    }
  }, TEST_TIMEOUT);

  // Verify that the bundle exposes the global object
  describe('Global object', () => {
    it('should expose the CarteFacile object globally', () => {
      expect(window.CarteFacile).toBeDefined();
    });
  });

  // Test map styles availability
  describe('Map styles', () => {
    it('should have all map styles available', () => {
      expect(CarteFacile.mapStyle).toBeDefined();
      expect(CarteFacile.mapStyle.simple).toBeDefined();
      expect(CarteFacile.mapStyle.desaturated).toBeDefined();
      expect(CarteFacile.mapStyle.aerial).toBeDefined();
    });
  });

  // Test map thumbnails availability
  describe('Map thumbnails', () => {
    it('should have all map thumbnails available', () => {
      expect(CarteFacile.mapThumbnails).toBeDefined();
      expect(CarteFacile.mapThumbnails.simple).toBeDefined();
      expect(CarteFacile.mapThumbnails.desaturated).toBeDefined();
      expect(CarteFacile.mapThumbnails.aerial).toBeDefined();
    });
  });

  // Test integration with maplibre-gl
  describe('Integration with maplibre-gl', () => {
    it('should work with maplibre-gl Map constructor', () => {
      const map = new window.maplibregl.Map({
        container: 'map',
        style: CarteFacile.mapStyle.simple,
      });
      
      expect(window.maplibregl.Map).toHaveBeenCalledWith({
        container: 'map',
        style: CarteFacile.mapStyle.simple,
      });
    });
  });
}); 
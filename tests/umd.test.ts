/**
 * Test suite for the UMD bundle
 * Verifies that the library is correctly exposed and usable in a browser environment
 */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const BUNDLE_PATH = path.resolve(__dirname, '../dist/carte-facile.js');

describe('UMD Bundle', () => {
    let window: any;
    let document: Document;

    beforeEach(() => {
        const dom = new JSDOM(`<!DOCTYPE html><div id="map"></div>`, {
            runScripts: 'dangerously'
        });

        window = dom.window;
        document = window.document;

        window.maplibregl = {
            Map: jest.fn(),
            NavigationControl: jest.fn(),
            ScaleControl: jest.fn()
        };

        const bundleCode = fs.readFileSync(BUNDLE_PATH, 'utf8');
        const script = document.createElement('script');
        script.textContent = bundleCode;
        document.body.appendChild(script);
    });

    it('should expose CarteFacile globally', () => {
        expect(window.CarteFacile).toBeDefined();
    });

    it('should expose map styles', () => {
        expect(window.CarteFacile.mapStyle).toBeDefined();
    });

    it('should expose map thumbnails', () => {
        expect(window.CarteFacile.mapThumbnails).toBeDefined();
    });

    it('should expose ZoomLevelControl', () => {
        expect(window.CarteFacile.ZoomLevelControl).toBeDefined();
    });
}); 
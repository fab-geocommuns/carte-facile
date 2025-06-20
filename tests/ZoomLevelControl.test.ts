import { JSDOM } from 'jsdom';
import { Map } from 'maplibre-gl';
import { ZoomLevelControl } from '../src';

// Set up a minimal DOM environment for testing
// We only need document for our tests, as we're testing DOM manipulation
const dom = new JSDOM('<!DOCTYPE html><body></body>');
(global as any).document = dom.window.document;

describe('ZoomLevelControl', () => {
    let control: ZoomLevelControl;
    let mockMap: Partial<Map>;
    let element: HTMLElement;

    beforeEach(() => {
        // Create a mock map with the minimum required methods:
        // - getZoom: to get the current zoom level
        // - on: to listen for zoom events
        mockMap = {
            getZoom: jest.fn().mockReturnValue(0),
            on: jest.fn()
        };
        control = new ZoomLevelControl();
        element = control.onAdd(mockMap as Map);
    });

    it('should create control with correct class names', () => {
        // Verify that the control has all required MapLibre control classes
        expect(element.className).toContain('maplibregl-ctrl');
        expect(element.className).toContain('maplibregl-ctrl-group');
        expect(element.className).toContain('cartefacile-ctrl-zoom-level');
    });

    it('should display initial zoom level', () => {
        // Check if the initial zoom level (0.0) is displayed
        expect(element.querySelector('span')?.textContent).toBe('0.0');
    });

    it('should update zoom level when map zooms', () => {
        // Simulate a zoom change to 2.5
        (mockMap.getZoom as jest.Mock).mockReturnValue(2.5);
        // Trigger the zoom callback that was registered
        (mockMap.on as jest.Mock).mock.calls[0][1]();
        
        // Verify that the displayed zoom level is updated
        expect(element.querySelector('span')?.textContent).toBe('2.5');
    });

    it('should clean up when removed', () => {
        // Create a parent element to test removal
        const parent = document.createElement('div');
        parent.appendChild(element);
        
        // Remove the control
        control.onRemove();
        // Verify that the element is removed from the DOM
        expect(element.parentNode).toBeNull();
    });
}); 
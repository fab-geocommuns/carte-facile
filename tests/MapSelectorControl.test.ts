import { JSDOM } from 'jsdom';
import { Map } from 'maplibre-gl';
import { MapSelectorControl } from '../src';

// Set up a minimal DOM environment for testing
const dom = new JSDOM('<!DOCTYPE html><body></body>');
(global as any).document = dom.window.document;
(global as any).window = dom.window;

describe('MapSelectorControl', () => {
    let control: MapSelectorControl;
    let mockMap: Partial<Map>;
    let element: HTMLElement;
    let mapContainer: HTMLElement;

    beforeEach(() => {
        // Create a mock map container
        mapContainer = document.createElement('div');
        mapContainer.id = 'map-container';
        document.body.appendChild(mapContainer);

        // Create a mock map with required methods
        mockMap = {
            getContainer: jest.fn().mockReturnValue(mapContainer),
            getStyle: jest.fn().mockReturnValue({ name: 'simple' }),
            getSource: jest.fn().mockReturnValue(null),
            getLayer: jest.fn().mockReturnValue(null),
            setStyle: jest.fn(),
            addSource: jest.fn(),
            addLayer: jest.fn(),
            removeLayer: jest.fn(),
            removeSource: jest.fn(),
            loaded: jest.fn().mockReturnValue(true),
            on: jest.fn(),
            off: jest.fn(),
            once: jest.fn()
        };

        control = new MapSelectorControl();
        element = control.onAdd(mockMap as Map);
    });

    afterEach(() => {
        // Clean up
        control.onRemove(mockMap as Map);
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Control Creation', () => {
        it('should create control with correct class names', () => {
            expect(element.className).toContain('maplibregl-ctrl');
            expect(element.className).toContain('maplibregl-ctrl-group');
        });

        it('should create toggle button with accessibility attributes', () => {
            const button = element.querySelector('button');
            expect(button).toBeDefined();
            expect(button?.getAttribute('aria-label')).toBe('Ouvrir le sélecteur de cartes et surcouches');
            expect(button?.getAttribute('aria-expanded')).toBe('false');
            expect(button?.getAttribute('aria-controls')).toBe('map-selector-panel');
        });

        it('should create panel with accessibility attributes', () => {
            const panel = mapContainer.querySelector('#map-selector-panel');
            expect(panel).toBeDefined();
            expect(panel?.getAttribute('role')).toBe('dialog');
            expect(panel?.getAttribute('aria-label')).toBe('Sélecteur de cartes et surcouches');
            expect((panel as HTMLElement)?.style.display).toBe('none');
        });

        it('should create style cards with proper roles and attributes', () => {
            const panel = mapContainer.querySelector('#map-selector-panel');
            const styleCards = panel?.querySelectorAll('[data-type="style"]');
            
            expect(styleCards?.length).toBeGreaterThan(0);
            
            styleCards?.forEach(card => {
                expect(card.getAttribute('role')).toBe('radio');
                expect(card.getAttribute('aria-checked')).toMatch(/^(true|false)$/);
                expect(card.getAttribute('tabindex')).toBe('0');
                expect(card.getAttribute('aria-label')).toContain('Style de carte');
            });
        });

        it('should create overlay cards with proper roles and attributes', () => {
            const panel = mapContainer.querySelector('#map-selector-panel');
            const overlayCards = panel?.querySelectorAll('[data-type="overlay"]');
            
            expect(overlayCards?.length).toBeGreaterThan(0);
            
            overlayCards?.forEach(card => {
                expect(card.getAttribute('role')).toBe('checkbox');
                expect(card.getAttribute('aria-checked')).toBe('false');
                expect(card.getAttribute('tabindex')).toBe('0');
                expect(card.getAttribute('aria-label')).toContain('Surcouche');
            });
        });
    });

    describe('Panel Toggle', () => {
        it('should open panel when toggle button is clicked', () => {
            const button = element.querySelector('button');
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            
            button?.click();
            
            expect(panel.style.display).toBe('block');
            expect(button?.getAttribute('aria-expanded')).toBe('true');
        });

        it('should close panel when close button is clicked', () => {
            const button = element.querySelector('button');
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            
            // Open panel first
            button?.click();
            expect(panel.style.display).toBe('block');
            
            // Close panel
            const closeButton = panel.querySelector('.cartefacile-btn--close');
            closeButton?.dispatchEvent(new dom.window.Event('click'));
            
            expect(panel.style.display).toBe('none');
            expect(button?.getAttribute('aria-expanded')).toBe('false');
        });
    });

    describe('Keyboard Navigation', () => {
        it('should activate cards with Enter and Space keys', () => {
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const styleCard = panel.querySelector('[data-type="style"]') as HTMLElement;
            const clickSpy = jest.spyOn(styleCard, 'click');
            
            // Test Enter key
            styleCard.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
            expect(clickSpy).toHaveBeenCalled();
            
            // Test Space key
            styleCard.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ' }));
            expect(clickSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Style Selection', () => {
        it('should change map style when style card is clicked', () => {
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const styleCard = panel.querySelector('[data-type="style"]') as HTMLElement;
            
            styleCard.click();
            
            expect(mockMap.setStyle).toHaveBeenCalled();
            expect(styleCard.getAttribute('aria-checked')).toBe('true');
            expect(styleCard.classList.contains('active')).toBe(true);
        });

        it('should update radio group when style is selected', () => {
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const styleCards = panel.querySelectorAll('[data-type="style"]');
            
            if (styleCards.length > 1) {
                const firstCard = styleCards[0] as HTMLElement;
                const secondCard = styleCards[1] as HTMLElement;
                
                // Click first card
                firstCard.click();
                expect(firstCard.getAttribute('aria-checked')).toBe('true');
                expect(secondCard.getAttribute('aria-checked')).toBe('false');
                
                // Click second card
                secondCard.click();
                expect(firstCard.getAttribute('aria-checked')).toBe('false');
                expect(secondCard.getAttribute('aria-checked')).toBe('true');
            }
        });
    });

    describe('Overlay Selection', () => {
        it('should toggle overlay when overlay card is clicked', () => {
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const overlayCard = panel.querySelector('[data-type="overlay"]') as HTMLElement;
            
            // First click should add overlay
            overlayCard.click();
            expect(overlayCard.getAttribute('aria-checked')).toBe('true');
            expect(overlayCard.classList.contains('active')).toBe(true);
            
            // Second click should remove overlay
            overlayCard.click();
            expect(overlayCard.getAttribute('aria-checked')).toBe('false');
            expect(overlayCard.classList.contains('active')).toBe(false);
        });
    });

    describe('State Synchronization', () => {
        it('should sync panel state with map style', () => {
            // Clean up existing control first
            control.onRemove(mockMap as Map);
            
            // Mock map with aerial style
            mockMap.getStyle = jest.fn().mockReturnValue({ name: 'aerial' });
            
            // Create a new control to test initial sync
            const newControl = new MapSelectorControl();
            newControl.onAdd(mockMap as Map);
            
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const aerialCard = panel.querySelector('[data-id="aerial"]') as HTMLElement;
            
            if (aerialCard) {
                expect(aerialCard.getAttribute('aria-checked')).toBe('true');
                expect(aerialCard.classList.contains('active')).toBe(true);
            }
            
            newControl.onRemove(mockMap as Map);
        });
    });

    describe('Configuration Options', () => {
        it('should respect styles option', () => {
            // Clean up existing control first
            control.onRemove(mockMap as Map);
            
            const customControl = new MapSelectorControl({
                styles: ['simple', 'aerial']
            });
            
            customControl.onAdd(mockMap as Map);
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const styleCards = panel.querySelectorAll('[data-type="style"]');
            
            expect(styleCards.length).toBe(2);
            expect(panel.querySelector('[data-id="simple"]')).toBeDefined();
            expect(panel.querySelector('[data-id="aerial"]')).toBeDefined();
            expect(panel.querySelector('[data-id="desaturated"]')).toBeNull();
            
            customControl.onRemove(mockMap as Map);
        });

        it('should respect overlays option', () => {
            // Clean up existing control first
            control.onRemove(mockMap as Map);
            
            const customControl = new MapSelectorControl({
                overlays: ['cadastre']
            });
            
            customControl.onAdd(mockMap as Map);
            const panel = mapContainer.querySelector('#map-selector-panel') as HTMLElement;
            const overlayCards = panel.querySelectorAll('[data-type="overlay"]');
            
            expect(overlayCards.length).toBe(1);
            expect(panel.querySelector('[data-id="cadastre"]')).toBeDefined();
            
            customControl.onRemove(mockMap as Map);
        });
    });

    describe('Default Position', () => {
        it('should return top-right as default position', () => {
            expect(control.getDefaultPosition()).toBe('top-right');
        });
    });

    describe('Cleanup', () => {
        it('should remove panel from DOM on cleanup', () => {
            const panel = mapContainer.querySelector('#map-selector-panel');
            expect(panel).toBeDefined();
            
            control.onRemove(mockMap as Map);
            
            expect(mapContainer.querySelector('#map-selector-panel')).toBeNull();
        });
    });
}); 
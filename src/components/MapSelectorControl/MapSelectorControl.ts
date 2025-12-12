import { mapStyles, mapThumbnails, addOverlay, removeOverlay, mapOverlays } from '../../maps/maps';
import { OverlayType, Overlay, MapOverlays } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import '../Button/Button.css';
import './MapSelectorControl.css';

/**
 * Configuration options for the MapSelectorControl
 */
export interface MapSelectorOptions {
    /** Available map styles to show in the selector (default: all styles) */
    styles?: (keyof typeof mapStyles)[];
    /** Available overlays to show in the selector (default: all overlays) */
    overlays?: OverlayType[];
}

/**
 * Simple utility to create elements from template strings
 */
function createFromTemplate(template: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    return wrapper.firstElementChild as HTMLElement;
}

/**
 * HTML templates for all UI component elements
 */
const TEMPLATES = {
    container: `
        <div class="maplibregl-ctrl maplibregl-ctrl-group"
             aria-label="Sélecteur de carte">
        </div>
    `,
    
    toggleButton: `
        <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--stack" 
                title="Sélecteur de carte"
                aria-label="Ouvrir le sélecteur de cartes et surcouches"
                aria-expanded="false"
                aria-controls="map-selector-panel">
        </button>
    `,
    
    panel: `
        <div class="maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-map-selector-panel"
             id="map-selector-panel"
             role="dialog"
             aria-label="Sélecteur de cartes et surcouches"
             style="display: none;">
          
          <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--close-circle cartefacile-btn--close"
                  title="Fermer"
                  aria-label="Fermer le sélecteur de cartes">
          </button>
          
          <h3 id="styles-heading">Cartes</h3>
          <div class="cartefacile-ctrl-map-selector-card-list"
               role="radiogroup"
               aria-labelledby="styles-heading">
          </div>
          
          <h3 id="overlays-heading">Surcouches</h3>
          <div class="cartefacile-ctrl-map-selector-card-list"
               role="group"
               aria-labelledby="overlays-heading">
          </div>
        </div>
    `,
    
    card: `
        <div class="cartefacile-ctrl-map-selector-card"
             tabindex="0"
             aria-checked="false">
          <img role="presentation">
          <div class="cartefacile-ctrl-map-selector-card__title"></div>
        </div>
    `
};

/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements maplibregl.IControl {
    private _map?: maplibregl.Map;
    private _options: Required<MapSelectorOptions>;
    private _panel?: HTMLDivElement;
    private _toggleButton?: HTMLButtonElement;
    private _keydownHandler?: (event: KeyboardEvent) => void;
    private _clickHandler?: (event: MouseEvent) => void;

    constructor(options: MapSelectorOptions = {}) {
        this._options = {
            styles: options.styles || Object.keys(mapStyles) as (keyof typeof mapStyles)[],
            overlays: options.overlays || Object.values(Overlay)
        };
    }

    /** Creates and initializes the control structure */
    onAdd(map: maplibregl.Map): HTMLElement {
        this._map = map;
        
        // Create the main control container from the HTML template
        const container = createFromTemplate(TEMPLATES.container);
        
        // Create the toggle button to open/close the selector panel
        this._toggleButton = createFromTemplate(TEMPLATES.toggleButton) as HTMLButtonElement;
        
        // Create the panel for selecting map styles and overlays
        this._panel = this._createPanel();
        
        // Add panel to map container
        map.getContainer().appendChild(this._panel);
        this._setupEventHandlers();
        
        // Sync panel state after map is loaded
        if (map.loaded()) {
            this._syncPanelState();
        } else {
            map.once('load', () => this._syncPanelState());
        }
        
        container.appendChild(this._toggleButton);
        return container;
    }

    /** Creates the main selector panel with style and overlay sections */
    private _createPanel(): HTMLDivElement {
        const panel = createFromTemplate(TEMPLATES.panel) as HTMLDivElement;
        
        const [stylesContainer, overlaysContainer] = panel.querySelectorAll('.cartefacile-ctrl-map-selector-card-list');
        this._populateCards(stylesContainer as HTMLDivElement, 'style');
        this._populateCards(overlaysContainer as HTMLDivElement, 'overlay');
        
        return panel;
    }

    /** Creates a card element from template */
    private _createCard(id: string, title: string, thumbnail: string, type: 'style' | 'overlay', onClick: () => void): HTMLElement {
        const card = createFromTemplate(TEMPLATES.card);
        
        // Configure card attributes securely
        card.setAttribute('data-id', id);
        card.setAttribute('data-type', type);
        card.setAttribute('role', type === 'style' ? 'radio' : 'checkbox');
        card.setAttribute('aria-label', `${type === 'style' ? 'Style de carte' : 'Surcouche'} : ${title}`);
        
        // Configure image securely
        const img = card.querySelector('img') as HTMLImageElement;
        img.src = thumbnail;
        img.alt = `Aperçu de ${title}`;
        
        // Configure title securely  
        const titleDiv = card.querySelector('.cartefacile-ctrl-map-selector-card__title') as HTMLDivElement;
        titleDiv.textContent = title;
        
        // Add event listeners
        card.addEventListener('click', onClick);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
        
        return card;
    }

    /** Populates containers with cards based on type */
    private _populateCards(container: HTMLDivElement, type: 'style' | 'overlay'): void {
        if (type === 'style') {
            Object.entries(mapStyles)
                .filter(([key]) => this._options.styles.includes(key as keyof typeof mapStyles))
                .forEach(([key, styleObj]) => {
                    const title = (styleObj as any)?.metadata?.fr?.name || 'Style sans nom';
                    const thumbnail = mapThumbnails[key as keyof typeof mapThumbnails] || '';
                    const card = this._createCard(key, title, thumbnail, 'style', 
                        () => this._onStyleClick(key, styleObj, container, card));
                    container.appendChild(card);
                });
        } else {
            Object.values(Overlay)
                .filter(id => this._options.overlays.includes(id as OverlayType))
                .forEach(id => {
                    const overlay = mapOverlays[id as keyof typeof mapOverlays];
                    const title = (overlay?.neutral as any)?.metadata?.fr?.name || 'Surcouche sans nom';
                    const thumbnail = mapThumbnails[id as keyof typeof mapThumbnails] || '';
                    const card = this._createCard(id, title, thumbnail, 'overlay', 
                        () => this._onOverlayClick(id, card));
                    container.appendChild(card);
                });
        }
    }

    /** Sets up essential event handlers for AAA compliance */
    private _setupEventHandlers(): void {
        if (!this._panel || !this._toggleButton) return;

        this._toggleButton.addEventListener('click', () => this._togglePanel());
        this._panel.querySelector('.cartefacile-btn--close')?.addEventListener('click', () => this._closePanel());
        
        this._keydownHandler = (event: KeyboardEvent) => {
            if (this._panel!.style.display === 'none') return;
            
            if (event.key === 'Escape') {
                event.preventDefault();
                this._closePanel();
                this._toggleButton!.focus();
            } else if (event.key === 'Tab') {
                const focusableElements = this._panel!.querySelectorAll('button, [tabindex="0"]');
                const first = focusableElements[0] as HTMLElement;
                const last = focusableElements[focusableElements.length - 1] as HTMLElement;
                
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        
        this._clickHandler = (event: MouseEvent) => {
            if (this._panel!.style.display !== 'none' && 
                !this._panel!.contains(event.target as Node) && 
                !this._toggleButton!.contains(event.target as Node)) {
                this._closePanel();
            }
        };
        
        document.addEventListener('keydown', this._keydownHandler);
        document.addEventListener('click', this._clickHandler);
    }

    /** Toggles panel visibility */
    private _togglePanel(): void {
        if (this._panel!.style.display === 'none') {
            this._openPanel();
        } else {
            this._closePanel();
        }
    }

    /** Opens the panel with focus management */
    private _openPanel(): void {
        if (!this._panel || !this._toggleButton) return;

        // Position panel dynamically
        const container = this._toggleButton.closest('.maplibregl-ctrl-group');
        const parent = container?.parentElement;
        let positionClass = 'cartefacile-ctrl-top-right';
        
        if (parent?.classList.contains('maplibregl-ctrl-top-left')) positionClass = 'cartefacile-ctrl-top-left';
        else if (parent?.classList.contains('maplibregl-ctrl-bottom-right')) positionClass = 'cartefacile-ctrl-bottom-right';
        else if (parent?.classList.contains('maplibregl-ctrl-bottom-left')) positionClass = 'cartefacile-ctrl-bottom-left';
        
        this._panel.classList.add(positionClass);
        this._panel.style.display = 'block';
        this._toggleButton.setAttribute('aria-expanded', 'true');
        
        // Focus first focusable element
        const firstFocusable = this._panel.querySelector('button, [tabindex="0"]') as HTMLElement;
        firstFocusable?.focus();
    }

    /** Closes the panel */
    private _closePanel(): void {
        if (!this._panel || !this._toggleButton) return;

        this._panel.style.display = 'none';
        this._toggleButton.setAttribute('aria-expanded', 'false');
        this._panel.classList.remove('cartefacile-ctrl-top-left', 'cartefacile-ctrl-top-right', 'cartefacile-ctrl-bottom-left', 'cartefacile-ctrl-bottom-right');
    }

    /** Syncs panel state with current map configuration */
    private _syncPanelState(): void {
        if (!this._map || !this._panel) return;

        try {
            const currentStyle = this._map.getStyle();
            
            // Sync style cards
            this._panel.querySelectorAll('[data-type="style"]').forEach(card => {
                const cardElement = card as HTMLElement;
                const styleId = cardElement.dataset.id;
                const isActive = currentStyle.name === styleId || (styleId === 'simple' && (!currentStyle.name || currentStyle.name === 'simple'));
                
                cardElement.classList.toggle('active', isActive);
                cardElement.setAttribute('aria-checked', isActive.toString());
            });

            // Sync overlay cards
            this._panel.querySelectorAll('[data-type="overlay"]').forEach(card => {
                const cardElement = card as HTMLElement;
                const overlayId = cardElement.dataset.id as OverlayType;
                const overlay = mapOverlays[overlayId];
                if (!overlay) return;

                const hasOverlay = Object.keys(overlay.neutral.sources).some(sourceId => this._map!.getSource(sourceId));
                cardElement.classList.toggle('active', hasOverlay);
                cardElement.setAttribute('aria-checked', hasOverlay.toString());
            });
        } catch (error) {
            console.warn('Failed to sync panel state:', error);
        }
    }

    /** Handles style card click - changes map style */
    private _onStyleClick(styleKey: string, styleObj: maplibregl.StyleSpecification, container: HTMLDivElement, card: HTMLElement): void {
        if (!this._map?.getContainer()) {
            console.warn('Map is not available');
            return;
        }

        try {
            this._map.setStyle(styleObj);
            
            // Update radio group
            container.querySelectorAll('.cartefacile-ctrl-map-selector-card').forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-checked', 'false');
            });
            
            card.classList.add('active');
            card.setAttribute('aria-checked', 'true');
        } catch (error) {
            console.error('Failed to set map style:', error);
        }
    }

    /** Handles overlay card click - toggles overlay visibility */
    private _onOverlayClick(overlayId: string, card: HTMLElement): void {
        if (!this._map?.getContainer()) {
            console.warn('Map is not available');
            return;
        }

        try {
            const isActive = card.classList.contains('active');
            
            if (isActive) {
                removeOverlay(this._map, overlayId as OverlayType);
                card.classList.remove('active');
                card.setAttribute('aria-checked', 'false');
            } else {
                addOverlay(this._map, overlayId as OverlayType);
                card.classList.add('active');
                card.setAttribute('aria-checked', 'true');
            }
        } catch (error) {
            console.error('Failed to toggle overlay:', error);
        }
    }

    /** Cleanup when control is removed */
    onRemove(): void {
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
        }
        if (this._clickHandler) {
            document.removeEventListener('click', this._clickHandler);
        }
        
        this._panel?.remove();
        this._map = undefined;
        this._panel = undefined;
        this._toggleButton = undefined;
    }

    /** Default position for the control */
    getDefaultPosition(): maplibregl.ControlPosition {
        return 'top-right';
    }
}   
import { mapStyles, mapThumbnails, addOverlay, removeOverlay, mapOverlays } from '../../maps/maps';
import { OverlayType, Overlay, MapOverlays } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import '../Button/Button.css';
import './MapSelectorControl.css';

/**
 * Configuration options for the MapSelectorControl
 */
export interface MapSelectorOptions {
    /** Available map styles (default: all) */
    styles?: (keyof typeof mapStyles)[];
    /** Available overlays (default: all) */
    overlays?: OverlayType[];
}

/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements maplibregl.IControl {
    private _map?: maplibregl.Map;
    private _options: Required<MapSelectorOptions>;
    private _panel?: HTMLDivElement;

    constructor(options: MapSelectorOptions = {}) {
        this._options = {
            styles: options.styles || Object.keys(mapStyles) as (keyof typeof mapStyles)[],
            overlays: options.overlays || Object.values(Overlay)
        };
    }

    /** Creates the control structure */
    onAdd(map: maplibregl.Map): HTMLElement {
        this._map = map;
        
        const container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        const toggleButton = this._createToggleButton();
        this._panel = this._createPanel(map);
        
        // Ajouter le panel au conteneur de la carte
        map.getContainer().appendChild(this._panel);
        
        this._setupToggleLogic(toggleButton, this._panel);
        
        // Synchroniser l'état initial après que la carte soit chargée
        if (map.loaded()) {
            this._syncPanelState();
        } else {
            map.once('load', () => this._syncPanelState());
        }
        
        container.appendChild(toggleButton);
        return container;
    }

    /** Creates the toggle button */
    private _createToggleButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--stack';
        button.title = 'Sélecteur de carte';
        
        return button;
    }

    /** Creates the main selector panel with cards */
    private _createPanel(map: maplibregl.Map): HTMLDivElement {
        const panel = document.createElement('div');
        panel.className = 'maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-map-selector-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--close-circle cartefacile-btn--close" title="Fermer"></button>
            <h3>Cartes</h3>
            <div class="cartefacile-ctrl-map-selector-card-list"></div>
            <h3>Surcouches</h3>
            <div class="cartefacile-ctrl-map-selector-card-list"></div>
        `;
        
        const [stylesContainer, overlaysContainer] = panel.querySelectorAll('.cartefacile-ctrl-map-selector-card-list');
        this._createStyleCards(stylesContainer as HTMLDivElement);
        this._createOverlayCards(overlaysContainer as HTMLDivElement);
        
        return panel;
    }

    /** Creates style selection cards */
    private _createStyleCards(container: HTMLDivElement): void {
        Object.entries(mapStyles)
            .filter(([key]) => this._options.styles.includes(key as keyof typeof mapStyles))
            .forEach(([key, styleObj]) => {
                const title = (styleObj as unknown as { metadata: { fr: { name: string } } }).metadata.fr.name;
                const card = this._createCard(key, title, mapThumbnails[key as keyof typeof mapThumbnails] || '');
                card.dataset.type = 'style';
                card.addEventListener('click', () => this._onStyleClick(key, styleObj, container, card));
                container.appendChild(card);
            });
    }

    /** Creates overlay selection cards */
    private _createOverlayCards(container: HTMLDivElement): void {
        Object.values(Overlay)
            .filter(id => this._options.overlays.includes(id as OverlayType))
            .forEach(id => {
                const overlay = mapOverlays[id as keyof typeof mapOverlays];
                const title = (overlay?.neutral as unknown as { metadata: { fr: { name: string } } }).metadata.fr.name;
                const card = this._createCard(id, title, mapThumbnails[id as keyof typeof mapThumbnails] || '');
                card.dataset.type = 'overlay';
                card.addEventListener('click', () => this._onOverlayClick(id, card));
                container.appendChild(card);
            });
    }

    /** Creates a card element */
    private _createCard(id: string, title: string, thumbnail: string): HTMLElement {
        const card = document.createElement('div');
        card.className = 'cartefacile-ctrl-map-selector-card';
        card.dataset.id = id;
        card.innerHTML = `
            <img src="${thumbnail}" alt="Aperçu de ${title}">
            <div class="cartefacile-ctrl-map-selector-card__title">${title}</div>
        `;
        return card;
    }

    /** Synchronise l'état du panneau avec la carte actuelle */
    private _syncPanelState(): void {
        if (!this._map || !this._panel) return;

        try {
            // Synchroniser les styles
            const currentStyle = this._map.getStyle();
            const styleCards = this._panel.querySelectorAll('[data-type="style"]');
            
            styleCards.forEach(card => {
                const cardElement = card as HTMLElement;
                const styleId = cardElement.dataset.id;
                const isActive = currentStyle.name === styleId || 
                               (styleId === 'simple' && !currentStyle.name) ||
                               (styleId === 'simple' && currentStyle.name === 'simple');
                
                cardElement.classList.toggle('active', isActive);
            });

            // Synchroniser les overlays
            const overlayCards = this._panel.querySelectorAll('[data-type="overlay"]');
            
            overlayCards.forEach(card => {
                const cardElement = card as HTMLElement;
                const overlayId = cardElement.dataset.id as OverlayType;
                const overlay = mapOverlays[overlayId];
                if (!overlay) return;

                // Vérifier si au moins une source de l'overlay est présente
                const hasOverlay = Object.keys(overlay.neutral.sources).some(sourceId => 
                    this._map!.getSource(sourceId)
                );
                
                cardElement.classList.toggle('active', hasOverlay);
            });
        } catch (error) {
            console.warn('Failed to sync panel state:', error);
        }
    }

    /** Ensures the map is available and valid */
    private _ensureMapAvailable(): boolean {
        if (!this._map || !this._map.getContainer()) {
            console.warn('Map is not available');
            return false;
        }
        return true;
    }

    /** Handles style card click - changes map style */
    private _onStyleClick(styleKey: string, styleObj: maplibregl.StyleSpecification, container: HTMLDivElement, card: HTMLElement): void {
        try {
            if (!this._ensureMapAvailable()) return;
            
            this._map!.setStyle(styleObj);
            container.querySelectorAll('.cartefacile-ctrl-map-selector-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        } catch (error) {
            console.error('Failed to set map style:', error);
        }
    }

    /** Handles overlay card click - toggles overlay visibility */
    private _onOverlayClick(overlayId: string, card: HTMLElement): void {
        try {
            if (!this._ensureMapAvailable()) return;
            
            const isActive = card.classList.contains('active');
            
            if (isActive) {
                removeOverlay(this._map!, overlayId as OverlayType);
                card.classList.remove('active');
            } else {
                addOverlay(this._map!, overlayId as OverlayType);
                card.classList.add('active');
            }
        } catch (error) {
            console.error('Failed to toggle overlay:', error);
        }
    }

    /**
     * Sets up the open/close logic for the map selector panel.
     * - Dynamically positions the panel based on the control's location.
     * - Handles open/close via the main button, close icon, or outside click.
     */
    private _setupToggleLogic(toggleButton: HTMLButtonElement, panel: HTMLDivElement): void {
        // Dynamically determine the panel position based on the MapLibre control location
        const getPanelPosition = (): string => {
            const container = toggleButton.closest('.maplibregl-ctrl-group');
            if (!container) return 'top-right';
            const parent = container.parentElement;
            const positionMap: Record<string, string> = {
                'maplibregl-ctrl-top-left': 'top-left',
                'maplibregl-ctrl-bottom-right': 'bottom-right',
                'maplibregl-ctrl-bottom-left': 'bottom-left'
            };
            for (const [mapClass, panelPosition] of Object.entries(positionMap)) {
                if (parent?.classList.contains(mapClass)) return panelPosition;
            }
            return 'top-right';
        };

        // Open or close the panel
        const toggle = () => {
            const isVisible = panel.style.display !== 'none';
            if (!isVisible) {
                // Add the dynamic position class to the panel
                panel.classList.add(`cartefacile-ctrl-${getPanelPosition()}`);
            }
            panel.style.display = isVisible ? 'none' : 'block';
        };

        // Open/close via the main button
        toggleButton.addEventListener('click', toggle);
        // Close via the close icon
        panel.querySelector('.cartefacile-btn--close')?.addEventListener('click', toggle);
        // Close if clicking outside the panel or button
        document.addEventListener('click', (e) => {
            if (
                panel.style.display !== 'none' &&
                !panel.contains(e.target as Node) &&
                !toggleButton.contains(e.target as Node)
            ) {
                toggle();
            }
        });
    }

    /** Cleanup when control is removed */
    onRemove(map: maplibregl.Map): void {
        this._map = undefined;
    }

    /** Default position for the control */
    getDefaultPosition(): maplibregl.ControlPosition {
        return 'top-right';
    }
}   
import { Map, IControl, ControlPosition, StyleSpecification } from 'maplibre-gl';
import { mapStyles, mapThumbnails, addOverlay, removeOverlay } from '../../maps/maps';
import { Overlay } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import './MapSelectorControl.css';

/** Template for the map selector panel structure */
const MAP_SELECTOR_TEMPLATE = `
    <button class="cartefacile-ctrl-map-selector-close-btn" title="Fermer">x</button>
    <h3>Cartes</h3>
    <div class="cartefacile-ctrl-map-selector-section"></div>
    <h3>Surcouches</h3>
    <div class="cartefacile-ctrl-map-selector-section"></div>
`;

/** Template for individual style/overlay cards */
const CARD_TEMPLATE = (id: string, title: string, thumbnail: string) => `
    <div class="cartefacile-ctrl-map-selector-card" data-id="${id}">
        <img src="${thumbnail}" alt="Aperçu de ${title}">
        <div class="cartefacile-ctrl-map-selector-card__title">${title}</div>
    </div>
`;

/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;
    private _toggleButton!: HTMLButtonElement;
    private _panel!: HTMLDivElement;
    private _styleCards: Record<string, HTMLElement> = {};
    private _overlayCards: Record<string, HTMLElement> = {};
    private _activeOverlays: Set<string> = new Set();

    constructor() {
        // Uses CarteFacile.mapStyles directly
    }

    /** Creates all style and overlay cards from available data */
    private _createAllCards(): void {
        // Create style cards
        Object.entries(mapStyles).forEach(([key, obj]) => {
            const card = this._createCardFromTemplate(
                key,
                key.charAt(0).toUpperCase() + key.slice(1),
                mapThumbnails[key as keyof typeof mapThumbnails] || '',
                () => this._onStyleClick(key, obj, card)
            );
            this._styleCards[key] = card;
            if (key === 'simple') card.classList.add('active');
        });

        // Create overlay cards
        Object.values(Overlay).forEach(id => {
            const card = this._createCardFromTemplate(
                id,
                id.charAt(0).toUpperCase() + id.slice(1),
                mapThumbnails[id as keyof typeof mapThumbnails] || '',
                () => this._onOverlayClick(id, card)
            );
            this._overlayCards[id] = card;
        });
    }

    /** Handles style card click events */
    private _onStyleClick(styleKey: string, styleObj: any, card: HTMLElement): void {
        this._map!.setStyle(styleObj);
        Object.values(this._styleCards).forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    }

    /** MapLibre IControl interface method - creates the control structure */
    onAdd(map: Map): HTMLElement {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        this._toggleButton = this._createToggleButton();
        const panel = this._createPanel();
        
        this._container.appendChild(this._toggleButton);
        this._container.appendChild(panel);
        return this._container;
    }

    /** Creates the toggle button */
    private _createToggleButton(): HTMLButtonElement {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'cartefacile-ctrl-map-selector';
        toggleButton.innerHTML = '🗺️';
        toggleButton.title = 'Sélecteur de carte';
        toggleButton.addEventListener('click', () => this._open(this._toggleButton, this._panel));
        return toggleButton;
    }

    /** Creates the main selector panel */
    private _createPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.className = 'cartefacile-ctrl-map-selector-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = MAP_SELECTOR_TEMPLATE;
        
        const closeButton = panel.querySelector('.cartefacile-ctrl-map-selector-close-btn') as HTMLButtonElement;
        const stylesContainer = panel.querySelectorAll('.cartefacile-ctrl-map-selector-section')[0] as HTMLDivElement;
        const overlaysContainer = panel.querySelectorAll('.cartefacile-ctrl-map-selector-section')[1] as HTMLDivElement;
        
        closeButton.addEventListener('click', () => this._close(this._toggleButton, panel));
        
        this._createAllCards();
        this._addCardsToContainers(stylesContainer, overlaysContainer);
        
        this._panel = panel;
        return panel;
    }

    /** Adds generated cards to their containers */
    private _addCardsToContainers(stylesContainer: HTMLDivElement, overlaysContainer: HTMLDivElement): void {
        Object.values(this._styleCards).forEach(card => stylesContainer.appendChild(card));
        Object.values(this._overlayCards).forEach(card => overlaysContainer.appendChild(card));
    }

    /** Creates a card element from template */
    private _createCardFromTemplate(id: string, title: string, thumbnail: string, onClick: () => void): HTMLElement {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = CARD_TEMPLATE(id, title, thumbnail);
        const card = tempDiv.firstElementChild as HTMLElement;
        card.addEventListener('click', onClick);
        return card;
    }

    /** Handles overlay card click events - toggles overlay visibility */
    private _onOverlayClick(overlayId: string, card: HTMLElement): void {
        const isActive = this._activeOverlays.has(overlayId);
        
        if (isActive) {
            removeOverlay(this._map!, overlayId as any);
            this._activeOverlays.delete(overlayId);
            card.classList.remove('active');
        } else {
            addOverlay(this._map!, overlayId as any);
            this._activeOverlays.add(overlayId);
            card.classList.add('active');
        }
    }

    /** Opens the selector panel */
    private _open(toggleButton: HTMLButtonElement, panel: HTMLDivElement): void {
        toggleButton.style.display = 'none';
        panel.style.display = 'block';
    }

    /** Closes the selector panel */
    private _close(toggleButton: HTMLButtonElement, panel: HTMLDivElement): void {
        toggleButton.style.display = 'block';
        panel.style.display = 'none';
    }

    /** MapLibre IControl interface method - cleanup */
    onRemove(): void {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }

    /** MapLibre IControl interface method - default position */
    getDefaultPosition(): ControlPosition {
        return 'top-right';
    }
} 
import { Map, IControl, ControlPosition, StyleSpecification } from 'maplibre-gl';
import { mapStyles, mapThumbnails, addOverlay, removeOverlay } from '../../maps/maps';
import { Overlay } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import './MapSelectorControl.css';

const MAP_SELECTOR_TEMPLATE = `
    <button class="cartefacile-ctrl-map-selector-close-btn" title="Fermer">x</button>
    <h3>Cartes</h3>
    <div class="cartefacile-ctrl-map-selector-section"></div>
    <h3>Surcouches</h3>
    <div class="cartefacile-ctrl-map-selector-section"></div>
`;

export class MapSelectorControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;
    private _toggleButton!: HTMLButtonElement;
    private _panel!: HTMLDivElement;
    private _styleCards: Record<string, HTMLElement> = {};
    private _overlayCards: Record<string, HTMLElement> = {};
    private _activeOverlays: Set<string> = new Set();

    constructor() {
        // Utilise directement CarteFacile.mapStyles
    }

    private _createAllCards(): void {
        // Styles
        Object.entries(mapStyles).forEach(([key, obj]) => {
            this._styleCards[key] = this._createCard(
                key,
                key.charAt(0).toUpperCase() + key.slice(1),
                mapThumbnails[key as keyof typeof mapThumbnails] || '',
                () => this._onStyleClick(key, obj, this._styleCards[key])
            );
            if (key === 'simple') this._styleCards[key].classList.add('active');
        });

        // Overlays
        Object.values(Overlay).forEach(id => {
            this._overlayCards[id] = this._createCard(
                id,
                id.charAt(0).toUpperCase() + id.slice(1),
                mapThumbnails[id as keyof typeof mapThumbnails] || '',
                () => this._onOverlayClick(id, this._overlayCards[id])
            );
        });
    }

    private _onStyleClick(styleKey: string, styleObj: any, card: HTMLElement): void {
        this._map!.setStyle(styleObj);
        Object.values(this._styleCards).forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    }

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

    private _createToggleButton(): HTMLButtonElement {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'cartefacile-ctrl-map-selector';
        toggleButton.innerHTML = '🗺️';
        toggleButton.title = 'Sélecteur de carte';
        toggleButton.addEventListener('click', () => this._open(toggleButton, this._panel));
        return toggleButton;
    }

    private _createPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.className = 'cartefacile-ctrl-map-selector-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = MAP_SELECTOR_TEMPLATE;
        
        // Récupérer les éléments avec querySelector
        const closeButton = panel.querySelector('.cartefacile-ctrl-map-selector-close-btn') as HTMLButtonElement;
        const stylesContainer = panel.querySelectorAll('.cartefacile-ctrl-map-selector-section')[0] as HTMLDivElement;
        const overlaysContainer = panel.querySelectorAll('.cartefacile-ctrl-map-selector-section')[1] as HTMLDivElement;
        
        closeButton.addEventListener('click', () => this._close(this._toggleButton, panel));
        
        this._createAllCards();
        this._addCardsToContainers(stylesContainer, overlaysContainer);
        
        this._panel = panel;
        return panel;
    }

    private _addCardsToContainers(stylesContainer: HTMLDivElement, overlaysContainer: HTMLDivElement): void {
        Object.values(this._styleCards).forEach(card => stylesContainer.appendChild(card));
        Object.values(this._overlayCards).forEach(card => overlaysContainer.appendChild(card));
    }

    private _createCard(id: string, title: string, thumbnail: string, onClick: () => void): HTMLElement {
        const card = document.createElement('div');
        card.className = 'cartefacile-ctrl-map-selector-card';
        card.dataset.id = id;
        
        card.innerHTML = `
            <img src="${thumbnail}" alt="Aperçu de ${title}">
            <div class="cartefacile-ctrl-map-selector-card__title">${title}</div>
        `;
        
        card.addEventListener('click', onClick);
        return card;
    }

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

    private _open(toggleButton: HTMLButtonElement, panel: HTMLDivElement): void {
        toggleButton.style.display = 'none';
        panel.style.display = 'block';
    }

    private _close(toggleButton: HTMLButtonElement, panel: HTMLDivElement): void {
        toggleButton.style.display = 'block';
        panel.style.display = 'none';
    }

    onRemove(): void {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }

    getDefaultPosition(): ControlPosition {
        return 'top-right';
    }
} 
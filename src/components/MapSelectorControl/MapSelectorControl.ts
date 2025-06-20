import { Map, IControl, ControlPosition } from 'maplibre-gl';
import { mapStyles, mapThumbnails, mapOverlays, addOverlay, removeOverlay } from '../../maps/maps';
import { Overlay } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import './MapSelectorControl.css';

export interface MapOption {
    id: string;
    name: string;
    style: any; // StyleSpecification
    thumbnail?: string;
}

export class MapSelectorControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;
    private _toggleButton!: HTMLButtonElement;
    private _panel!: HTMLDivElement;
    private _closeButton!: HTMLButtonElement;
    private _styleCards: Record<string, HTMLElement> = {};
    private _overlayCards: Record<string, HTMLElement> = {};
    private _options: MapOption[];
    private _activeOverlays: Set<string> = new Set();
    private _isOpen: boolean = false;

    constructor(options: MapOption[] = []) {
        // Par défaut, utiliser tous les styles de carte-facile
        const defaultOptions: MapOption[] = Object.keys(mapStyles).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            style: mapStyles[key as keyof typeof mapStyles],
            thumbnail: mapThumbnails[key as keyof typeof mapThumbnails]
        }));
        
        this._options = options.length > 0 ? options : defaultOptions;
    }

    onAdd(map: Map): HTMLElement {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        this._createToggleButton();
        this._createPanel();
        
        this._container.appendChild(this._toggleButton);
        this._container.appendChild(this._panel);
        return this._container;
    }

    private _createToggleButton() {
        this._toggleButton = document.createElement('button');
        this._toggleButton.className = 'cartefacile-ctrl-map-selector-button';
        this._toggleButton.innerHTML = '🗺️';
        this._toggleButton.title = 'Sélecteur de carte';
        this._toggleButton.addEventListener('click', () => this.open());
    }

    private _createPanel() {
        this._panel = document.createElement('div');
        this._panel.className = 'cartefacile-ctrl-map-selector-panel';
        this._panel.style.display = 'none';
        
        this._createCloseButton();
        this._createStyleCards();
        this._createOverlayCards();
        
        this._panel.appendChild(this._closeButton);
        this._panel.appendChild(this._createStylesContainer());
        this._panel.appendChild(this._createOverlaysContainer());
    }

    private _createCloseButton() {
        this._closeButton = document.createElement('button');
        this._closeButton.className = 'map-selector-close';
        this._closeButton.innerHTML = '×';
        this._closeButton.title = 'Fermer';
        this._closeButton.addEventListener('click', () => this.close());
    }

    private _createStyleCards() {
        this._options.forEach(option => {
            const card = this._createStyleCard(option);
            this._styleCards[option.id] = card;
            
            // Marquer le style simple comme actif par défaut
            if (option.id === 'simple') {
                card.classList.add('active');
            }
        });
    }

    private _createStyleCard(option: MapOption): HTMLElement {
        const card = document.createElement('div');
        card.className = 'map-selector-card';
        card.dataset.styleId = option.id;
        
        const img = document.createElement('img');
        img.src = option.thumbnail || '';
        img.alt = `Aperçu de ${option.name}`;
        
        const title = document.createElement('div');
        title.className = 'map-selector-card__title';
        title.textContent = option.name;
        
        card.appendChild(img);
        card.appendChild(title);
        
        card.addEventListener('click', () => this._onStyleClick(option, card));
        
        return card;
    }

    private _createOverlayCards() {
        Object.values(Overlay).forEach(overlayId => {
            const card = this._createOverlayCard(overlayId);
            this._overlayCards[overlayId] = card;
        });
    }

    private _createOverlayCard(overlayId: string): HTMLElement {
        const card = document.createElement('div');
        card.className = 'map-selector-card';
        card.dataset.overlayId = overlayId;
        
        const thumbnailId = overlayId;
        const img = document.createElement('img');
        img.src = mapThumbnails[thumbnailId as keyof typeof mapThumbnails] || '';
        img.alt = `Aperçu de ${overlayId}`;
        
        const title = document.createElement('div');
        title.className = 'map-selector-card__title';
        title.textContent = overlayId.charAt(0).toUpperCase() + overlayId.slice(1);
        
        card.appendChild(img);
        card.appendChild(title);
        
        card.addEventListener('click', () => this._onOverlayClick(overlayId, card));
        
        return card;
    }

    private _createStylesContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'map-selector-styles';
        Object.values(this._styleCards).forEach(card => container.appendChild(card));
        return container;
    }

    private _createOverlaysContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'map-selector-overlays';
        Object.values(this._overlayCards).forEach(card => container.appendChild(card));
        return container;
    }

    private _onStyleClick(option: MapOption, card: HTMLElement) {
        this._map!.setStyle(option.style);
        this._updateStyleSelection(card);
    }

    private _onOverlayClick(overlayId: string, card: HTMLElement) {
        if (this._activeOverlays.has(overlayId)) {
            removeOverlay(this._map!, overlayId as any);
            this._activeOverlays.delete(overlayId);
            card.classList.remove('active');
        } else {
            addOverlay(this._map!, overlayId as any);
            this._activeOverlays.add(overlayId);
            card.classList.add('active');
        }
    }

    private _updateStyleSelection(activeCard: HTMLElement) {
        // Mettre à jour seulement les cartes de style
        Object.values(this._styleCards).forEach(card => card.classList.remove('active'));
        activeCard.classList.add('active');
    }

    private open() {
        this._isOpen = true;
        this._toggleButton.style.display = 'none';
        this._panel.style.display = 'block';
    }

    private close() {
        this._isOpen = false;
        this._toggleButton.style.display = 'block';
        this._panel.style.display = 'none';
    }

    onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }

    getDefaultPosition(): ControlPosition {
        return 'top-right';
    }

    // Méthode pour ajouter une option dynamiquement
    addOption(option: MapOption) {
        this._options.push(option);
        // Note: nécessiterait de recréer l'interface
    }

    // Méthode pour définir l'option sélectionnée
    setSelectedMap(mapId: string) {
        const card = this._styleCards[mapId];
        if (card) {
            this._onStyleClick(this._options.find(opt => opt.id === mapId)!, card);
        }
    }
} 
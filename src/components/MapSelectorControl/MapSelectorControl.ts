import { Map, IControl, ControlPosition } from 'maplibre-gl';
import { mapStyles, mapThumbnails, addOverlay, removeOverlay } from '../../maps/maps';
import { Overlay } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import './MapSelectorControl.css';

/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements IControl {
    private _map?: Map;
    private _activeOverlays: Set<string> = new Set();

    /** Creates the control structure */
    onAdd(map: Map): HTMLElement {
        this._map = map;
        const container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        const toggleButton = this._createToggleButton();
        const panel = this._createPanel();
        
        this._setupToggleLogic(toggleButton, panel);
        
        container.appendChild(toggleButton);
        container.appendChild(panel);
        return container;
    }

    /** Creates the toggle button */
    private _createToggleButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'cartefacile-ctrl-map-selector';
        button.innerHTML = '🗺️';
        button.title = 'Sélecteur de carte';
        return button;
    }

    /** Creates the main selector panel with cards */
    private _createPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.className = 'cartefacile-ctrl-map-selector-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <button class="cartefacile-ctrl-map-selector-close-btn" title="Fermer">x</button>
            <h3>Cartes</h3>
            <div class="cartefacile-ctrl-map-selector-section"></div>
            <h3>Surcouches</h3>
            <div class="cartefacile-ctrl-map-selector-section"></div>
        `;
        
        const [stylesContainer, overlaysContainer] = panel.querySelectorAll('.cartefacile-ctrl-map-selector-section');
        this._createStyleCards(stylesContainer as HTMLDivElement);
        this._createOverlayCards(overlaysContainer as HTMLDivElement);
        
        return panel;
    }

    /** Creates style selection cards */
    private _createStyleCards(container: HTMLDivElement): void {
        Object.entries(mapStyles).forEach(([key, styleObj]) => {
            const card = this._createCard(key, key.charAt(0).toUpperCase() + key.slice(1), mapThumbnails[key as keyof typeof mapThumbnails] || '');
            card.addEventListener('click', () => this._onStyleClick(key, styleObj, container, card));
            container.appendChild(card);
            if (key === 'simple') card.classList.add('active');
        });
    }

    /** Creates overlay selection cards */
    private _createOverlayCards(container: HTMLDivElement): void {
        Object.values(Overlay).forEach(id => {
            const card = this._createCard(id, id.charAt(0).toUpperCase() + id.slice(1), mapThumbnails[id as keyof typeof mapThumbnails] || '');
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

    /** Handles style card click - changes map style */
    private _onStyleClick(styleKey: string, styleObj: any, container: HTMLDivElement, card: HTMLElement): void {
        try {
            this._map?.setStyle(styleObj);
            container.querySelectorAll('.cartefacile-ctrl-map-selector-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        } catch (error) {
            console.error('Failed to set map style:', error);
        }
    }

    /** Handles overlay card click - toggles overlay visibility */
    private _onOverlayClick(overlayId: string, card: HTMLElement): void {
        try {
            const isActive = this._activeOverlays.has(overlayId);
            if (isActive) {
                this._map && removeOverlay(this._map, overlayId as any);
                this._activeOverlays.delete(overlayId);
                card.classList.remove('active');
            } else {
                this._map && addOverlay(this._map, overlayId as any);
                this._activeOverlays.add(overlayId);
                card.classList.add('active');
            }
        } catch (error) {
            console.error('Failed to toggle overlay:', error);
        }
    }

    /** Sets up panel toggle functionality */
    private _setupToggleLogic(toggleButton: HTMLButtonElement, panel: HTMLDivElement): void {
        const toggle = () => {
            const isVisible = panel.style.display !== 'none';
            toggleButton.style.display = isVisible ? 'block' : 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        };
        
        toggleButton.addEventListener('click', toggle);
        panel.querySelector('.cartefacile-ctrl-map-selector-close-btn')?.addEventListener('click', toggle);
    }

    /** Cleanup when control is removed */
    onRemove(): void {
        this._map = undefined;
        this._activeOverlays.clear();
    }

    /** Default position for the control */
    getDefaultPosition(): ControlPosition {
        return 'top-right';
    }
} 
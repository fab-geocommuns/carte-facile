import { mapStyles, mapThumbnails, addOverlay, removeOverlay, mapOverlays } from '../../maps/maps';
import { OverlayType, Overlay } from '../../maps/types';
import '../../themes/styles/dsfr.css';
import '../Button/Button.css';
import './MapSelectorControl.css';

/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements maplibregl.IControl {
    private _map?: maplibregl.Map;
    private _activeOverlays: Set<string> = new Set();

    /** Creates the control structure */
    onAdd(map: maplibregl.Map): HTMLElement {
        this._map = map;
        
        const container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        const toggleButton = this._createToggleButton();
        const panel = this._createPanel(map);
        
        // Ajouter le panel au conteneur de la carte
        map.getContainer().appendChild(panel);
        
        this._setupToggleLogic(toggleButton, panel);
        
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
        Object.entries(mapStyles).forEach(([key, styleObj]) => {
            const title = (styleObj as unknown as { metadata: { fr: { name: string } } }).metadata.fr.name;
            const card = this._createCard(key, title, mapThumbnails[key as keyof typeof mapThumbnails] || '');
            card.addEventListener('click', () => this._onStyleClick(key, styleObj, container, card));
            container.appendChild(card);
            if (key === 'simple') card.classList.add('active');
        });
    }

    /** Creates overlay selection cards */
    private _createOverlayCards(container: HTMLDivElement): void {
        Object.values(Overlay).forEach(id => {
            const overlay = mapOverlays[id as keyof typeof mapOverlays];
            const title = (overlay?.neutral as unknown as { metadata: { fr: { name: string } } }).metadata.fr.name;
            const card = this._createCard(id, title, mapThumbnails[id as keyof typeof mapThumbnails] || '');
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
    private _onStyleClick(styleKey: string, styleObj: maplibregl.StyleSpecification, container: HTMLDivElement, card: HTMLElement): void {
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
                this._map && removeOverlay(this._map, overlayId as OverlayType);
                this._activeOverlays.delete(overlayId);
                card.classList.remove('active');
            } else {
                this._map && addOverlay(this._map, overlayId as OverlayType);
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
            if (!isVisible) {
                const container = toggleButton.closest('.maplibregl-ctrl-group');
                let position = 'top-right';
                
                if (container) {
                    const parent = container.parentElement;
                    const positionMap: Record<string, string> = {
                        'maplibregl-ctrl-top-left': 'top-left',
                        'maplibregl-ctrl-bottom-right': 'bottom-right',
                        'maplibregl-ctrl-bottom-left': 'bottom-left'
                    };
                    
                    for (const [mapClass, panelPosition] of Object.entries(positionMap)) {
                        if (parent?.classList.contains(mapClass)) {
                            position = panelPosition;
                            break;
                        }
                    }
                }
                
                // Ajouter la nouvelle classe de position
                panel.classList.add(`cartefacile-ctrl-${position}`);
            }
            panel.style.display = isVisible ? 'none' : 'block';
        };
        
        toggleButton.addEventListener('click', toggle);
        panel.querySelector('.cartefacile-btn--close')?.addEventListener('click', toggle);
        
        document.addEventListener('click', (e) => {
            if (panel.style.display !== 'none' && 
                !panel.contains(e.target as Node) && 
                !toggleButton.contains(e.target as Node)) {
                toggle();
            }
        });
    }

    /** Cleanup when control is removed */
    onRemove(map: maplibregl.Map): void {
        this._map = undefined;
        this._activeOverlays.clear();
    }

    /** Default position for the control */
    getDefaultPosition(): maplibregl.ControlPosition {
        return 'top-right';
    }
}   
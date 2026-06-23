import { LayerGroupType, LayerConfig } from '../../maps/types';
import { showLayer, hideLayer } from '../../maps/maps';
import '../../themes/styles/dsfr.css';
import '../Button/Button.css';
import './LayersControl.css';

export interface LayersControlOptions {
    /** Filter to specific layer groups. If omitted, all groups found in the style are shown. */
    groups?: string[];
    /** Whether the panel is open on first render (default: false) */
    open?: boolean;
    /** Custom label resolver for group names not in the built-in list */
    getLabel?: (group: string) => string;
}

/** Labels for known built-in layer groups */
const LAYER_LABELS: Record<string, string> = {
    land: 'Terres',
    ocean: 'Océans et mers',
    water_polygons: 'Plans d\'eau',
    water_lines: 'Cours d\'eau',
    water_polygons_labels: 'Noms des plans d\'eau',
    water_lines_labels: 'Noms des cours d\'eau',
    streets: 'Routes et réseaux de transport',
    street_polygons: 'Zones de voirie',
    street_labels: 'Noms des routes',
    public_transport: 'Transports en commun',
    buildings: 'Bâtiments',
    sites: 'Sites et zones d\'activité',
    dam_lines: 'Barrages',
    pier_lines: 'Jetées et pontons',
    boundaries: 'Limites des pays',
    boundaries_regions: 'Limites des régions',
    boundaries_departments: 'Limites des départements',
    boundaries_departements: 'Limites des départements',
    boundaries_epcis: 'Limites des EPCIs',
    boundaries_communes: 'Limites des communes',
    cadastral_sections: 'Sections cadastrales',
    cadastral_parcels: 'Parcelles cadastrales',
};


function createFromTemplate(template: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    return wrapper.firstElementChild as HTMLElement;
}

const TEMPLATES = {
    container: `
        <div class="maplibregl-ctrl maplibregl-ctrl-group"
             aria-label="Visibilité des couches">
        </div>
    `,

    toggleButton: `
        <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--eye-off"
                title="Couches"
                aria-label="Ouvrir le panneau de visibilité des couches"
                aria-expanded="false"
                aria-controls="layers-control-panel">
        </button>
    `,

    panel: `
        <div class="maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-layers-panel"
             id="layers-control-panel"
             role="dialog"
             aria-label="Visibilité des couches"
             style="display: none;">

          <div class="cartefacile-ctrl-layers-panel-header">
            <h3 id="layers-heading">Couches</h3>
            <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--close-circle cartefacile-btn--close"
                    title="Fermer"
                    aria-label="Fermer le panneau des couches">
            </button>
          </div>

          <ul class="cartefacile-ctrl-layers-list"
              role="group"
              aria-labelledby="layers-heading">
          </ul>
        </div>
    `,
};

/**
 * MapLibre control for toggling layer group visibility with checkboxes.
 * Groups are discovered dynamically from the map style — no static list required.
 */
export class LayersControl implements maplibregl.IControl {
    private _map?: maplibregl.Map;
    private _options: { groups?: string[]; open: boolean; getLabel?: (group: string) => string };
    private _panel?: HTMLDivElement;
    private _toggleButton?: HTMLButtonElement;
    private _keydownHandler?: (event: KeyboardEvent) => void;
    private _clickHandler?: (event: MouseEvent) => void;
    private _styledataHandler?: () => void;
    private _idleHandler?: () => void;
    private _knownGroupsKey: string = '';

    constructor(options: LayersControlOptions = {}) {
        this._options = {
            groups: options.groups,
            open: options.open ?? false,
            getLabel: options.getLabel,
        };
    }

    onAdd(map: maplibregl.Map): HTMLElement {
        this._map = map;

        const container = createFromTemplate(TEMPLATES.container);
        this._toggleButton = createFromTemplate(TEMPLATES.toggleButton) as HTMLButtonElement;
        this._panel = createFromTemplate(TEMPLATES.panel) as HTMLDivElement;

        map.getContainer().appendChild(this._panel);
        this._setupEventHandlers();

        this._styledataHandler = () => {
            this._syncAvailableGroups();
            this._syncCheckboxState();
        };
        map.on('styledata', this._styledataHandler);

        // `idle` fires after addLayer/removeLayer completes rendering — catches overlay changes
        // that may not trigger styledata in all MapLibre versions.
        this._idleHandler = () => this._syncAvailableGroups();
        map.on('idle', this._idleHandler);

        if (map.loaded()) {
            this._syncAvailableGroups();
            this._syncCheckboxState();
        } else {
            map.once('load', () => {
                this._syncAvailableGroups();
                this._syncCheckboxState();
            });
        }

        container.appendChild(this._toggleButton);

        if (this._options.open) {
            setTimeout(() => this._openPanel(), 0);
        }

        return container;
    }

    private _resolveLabel(group: string): string {
        if (group in LAYER_LABELS) return LAYER_LABELS[group];
        if (this._options.getLabel) return this._options.getLabel(group);
        return group.replace(/_/g, ' ');
    }

    private _createCheckboxItem(group: string, checked: boolean = true): HTMLLIElement {
        const item = document.createElement('li');

        const label = document.createElement('label');
        label.className = 'cartefacile-ctrl-layers-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        checkbox.dataset.group = group;

        checkbox.addEventListener('change', () => {
            if (!this._map) return;
            if (checkbox.checked) {
                showLayer(this._map, group as LayerGroupType);
            } else {
                hideLayer(this._map, group as LayerGroupType);
            }
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(this._resolveLabel(group)));
        item.appendChild(label);

        return item;
    }

    /**
     * Discovers layer groups present in the current style and rebuilds the list.
     * Groups are ordered by their first appearance in the layer stack.
     */
    private _syncAvailableGroups(): void {
        if (!this._map || !this._panel) return;

        try {
            const layers = this._map.getStyle().layers ?? [];

            // Collect unique groups in layer order
            const presentGroups: string[] = [];
            const seen = new Set<string>();
            for (const layer of layers) {
                const group = (layer as LayerConfig).metadata?.['cartefacile:group'] as string | undefined;
                if (group && !seen.has(group)) {
                    if (!this._options.groups || this._options.groups.includes(group)) {
                        presentGroups.push(group);
                        seen.add(group);
                    }
                }
            }

            // Short-circuit if groups haven't changed (idle fires frequently)
            const key = presentGroups.join(',');
            if (key === this._knownGroupsKey) return;
            this._knownGroupsKey = key;

            // Preserve current checkbox states across rebuilds
            const savedStates = new Map<string, boolean>();
            this._panel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
                if (cb.dataset.group) savedStates.set(cb.dataset.group, cb.checked);
            });

            const list = this._panel.querySelector('.cartefacile-ctrl-layers-list') as HTMLUListElement;
            list.innerHTML = '';
            presentGroups.forEach(group => {
                list.appendChild(this._createCheckboxItem(group, savedStates.get(group) ?? true));
            });
        } catch (error) {
            console.warn('LayersControl: failed to sync available groups:', error);
        }
    }

    /** Syncs checkboxes with the actual visibility state of the map layers */
    private _syncCheckboxState(): void {
        if (!this._map || !this._panel) return;

        try {
            const layers = this._map.getStyle().layers ?? [];

            this._panel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(checkbox => {
                const group = checkbox.dataset.group;
                if (!group) return;

                const matchingLayer = layers.find(layer =>
                    (layer as LayerConfig).metadata?.['cartefacile:group'] === group
                );

                if (matchingLayer) {
                    const visibility = this._map!.getLayoutProperty(matchingLayer.id, 'visibility');
                    checkbox.checked = visibility !== 'none';
                }
            });
        } catch (error) {
            console.warn('LayersControl: failed to sync checkbox state:', error);
        }
    }

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
                const focusable = this._panel!.querySelectorAll<HTMLElement>('button, input');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

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
            if (
                this._panel!.style.display !== 'none' &&
                !this._panel!.contains(event.target as Node) &&
                !this._toggleButton!.contains(event.target as Node)
            ) {
                this._closePanel();
            }
        };

        document.addEventListener('keydown', this._keydownHandler);
        document.addEventListener('click', this._clickHandler);
    }

    private _togglePanel(): void {
        if (this._panel!.style.display === 'none') {
            this._openPanel();
        } else {
            this._closePanel();
        }
    }

    private _openPanel(): void {
        if (!this._panel || !this._toggleButton) return;

        const container = this._toggleButton.closest('.maplibregl-ctrl-group');
        const parent = container?.parentElement;
        let positionClass = 'cartefacile-ctrl-top-right';

        if (parent?.classList.contains('maplibregl-ctrl-top-left')) positionClass = 'cartefacile-ctrl-top-left';
        else if (parent?.classList.contains('maplibregl-ctrl-bottom-right')) positionClass = 'cartefacile-ctrl-bottom-right';
        else if (parent?.classList.contains('maplibregl-ctrl-bottom-left')) positionClass = 'cartefacile-ctrl-bottom-left';

        this._panel.classList.add(positionClass);
        this._panel.style.display = 'block';
        this._toggleButton.setAttribute('aria-expanded', 'true');
    }

    private _closePanel(): void {
        if (!this._panel || !this._toggleButton) return;

        this._panel.style.display = 'none';
        this._toggleButton.setAttribute('aria-expanded', 'false');
        this._panel.classList.remove(
            'cartefacile-ctrl-top-left',
            'cartefacile-ctrl-top-right',
            'cartefacile-ctrl-bottom-left',
            'cartefacile-ctrl-bottom-right'
        );
    }

    onRemove(): void {
        if (this._styledataHandler) this._map?.off('styledata', this._styledataHandler);
        if (this._idleHandler) this._map?.off('idle', this._idleHandler);
        if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);
        if (this._clickHandler) document.removeEventListener('click', this._clickHandler);

        this._panel?.remove();
        this._map = undefined;
        this._panel = undefined;
        this._toggleButton = undefined;
    }

    getDefaultPosition(): maplibregl.ControlPosition {
        return 'top-left';
    }
}

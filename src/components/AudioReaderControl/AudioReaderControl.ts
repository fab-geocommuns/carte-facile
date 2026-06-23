import type { Map, IControl, ControlPosition, MapMouseEvent, MapGeoJSONFeature } from 'maplibre-gl';
import '../../themes/styles/dsfr.css';
import '../Button/Button.css';
import './AudioReaderControl.css';

export interface AudioReaderControlOptions {
    /** Speech rate. Default: 1 */
    speechRate?: number;
    /** Speech language. Default: 'fr-FR' */
    lang?: string;
}

const GROUP_LABELS: Record<string, string> = {
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

const NAME_PROPS = ['texte', 'designation', 'name', 'nom', 'name:fr', 'toponyme', 'libelle', 'NOM'];
const PLACE_NAME_PROPS = ['nom_com', 'nom_dep', 'nom_reg', 'libelle_com', 'nom_lieu', 'toponyme', 'libelle'];

export class AudioReaderControl implements IControl {
    private _map?: Map;
    private _active = false;
    private _lang: string;
    private _speechRate: number;
    private _button?: HTMLButtonElement;
    private _liveRegion?: HTMLElement;
    private _clickHandler?: (e: MapMouseEvent) => void;

    constructor(options: AudioReaderControlOptions = {}) {
        this._lang = options.lang ?? 'fr-FR';
        this._speechRate = options.speechRate ?? 1;
    }

    onAdd(map: Map): HTMLElement {
        this._map = map;

        this._liveRegion = document.createElement('div');
        this._liveRegion.setAttribute('aria-live', 'polite');
        this._liveRegion.setAttribute('aria-atomic', 'true');
        this._liveRegion.className = 'cartefacile-sr-only';
        document.body.appendChild(this._liveRegion);

        this._button = document.createElement('button');
        this._button.className = 'cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--volume-up';
        this._button.title = 'Lecture audio';
        this._button.setAttribute('aria-label', 'Activer la lecture audio');
        this._button.setAttribute('aria-pressed', 'false');
        this._button.addEventListener('click', () => this._toggle());

        this._clickHandler = (e: MapMouseEvent) => {
            if (!this._active) return;
            this._readAt(e.point);
        };
        map.on('click', this._clickHandler);

        const container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        container.appendChild(this._button);
        return container;
    }

    private _toggle(): void {
        this._active = !this._active;
        this._button?.setAttribute('aria-pressed', String(this._active));
        this._button?.setAttribute(
            'aria-label',
            this._active ? 'Désactiver la lecture audio' : 'Activer la lecture audio'
        );
        if (window.speechSynthesis) speechSynthesis.cancel();
    }

    private _readAt(point: maplibregl.PointLike): void {
        if (!this._map) return;

        const features = this._map.queryRenderedFeatures(point);
        if (features.length === 0) return;

        // Prefer a feature with an explicit name
        for (const feature of features) {
            const name = this._resolveName(feature);
            if (!name) continue;
            const group = this._resolveGroup(feature);
            this._speak(group ? `${name}, ${group}` : name);
            return;
        }

        // Fallback: read symbo + place name if available
        const props = features[0].properties ?? {};
        const symbo = props['symbo'] ? String(props['symbo']) : null;
        const placeName = PLACE_NAME_PROPS.map(p => props[p]).find(v => typeof v === 'string' && v.trim()) ?? null;
        const text = [symbo, placeName].filter(Boolean).join(', ');
        if (text) this._speak(text);
    }

    private _speak(text: string): void {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = this._lang;
        u.rate = this._speechRate;
        speechSynthesis.speak(u);
        if (this._liveRegion) this._liveRegion.textContent = text;
    }

    private _resolveName(feature: MapGeoJSONFeature): string | null {
        for (const prop of NAME_PROPS) {
            const val = feature.properties?.[prop];
            if (typeof val === 'string' && val.trim()) return val.trim();
        }
        return null;
    }

    private _resolveGroup(feature: MapGeoJSONFeature): string {
        const styleLayer = this._map?.getStyle().layers?.find(l => l.id === feature.layer.id) as any;
        const group = styleLayer?.metadata?.['cartefacile:group'];
        if (group && GROUP_LABELS[group]) return GROUP_LABELS[group];
        if (group) return group.replace(/_/g, ' ');
        return '';
    }

    onRemove(): void {
        if (this._clickHandler) this._map?.off('click', this._clickHandler);
        this._liveRegion?.remove();
        speechSynthesis.cancel();
        this._map = undefined;
    }

    getDefaultPosition(): ControlPosition {
        return 'top-left';
    }
}

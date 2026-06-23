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


const NAME_PROPS = ['texte', 'designation', 'nom_du_professionnel', 'name', 'nom', 'name:fr', 'toponyme', 'libelle', 'NOM'];
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
            this._speak(name);
            this._flashAt(point);
            return;
        }

        // Fallback: read symbo + place name if available
        const props = features[0].properties ?? {};
        const symbo = props['symbo'] ? String(props['symbo']) : null;
        const placeName = PLACE_NAME_PROPS.map(p => props[p]).find(v => typeof v === 'string' && v.trim()) ?? null;
        const text = [symbo, placeName].filter(Boolean).join(', ');
        if (text) {
            this._speak(text);
            this._flashAt(point);
        }
    }

    private _flashAt(point: maplibregl.PointLike): void {
        const container = this._map?.getCanvasContainer();
        if (!container) return;
        const p = point as { x: number; y: number };
        for (let i = 0; i < 2; i++) {
            const ring = document.createElement('div');
            ring.className = `cartefacile-sonar-ring${i === 1 ? ' cartefacile-sonar-ring--delayed' : ''}`;
            ring.style.left = `${p.x}px`;
            ring.style.top = `${p.y}px`;
            container.appendChild(ring);
            ring.addEventListener('animationend', () => ring.remove(), { once: true });
        }
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

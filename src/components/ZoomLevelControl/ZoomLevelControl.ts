import { Map, IControl } from 'maplibre-gl';
import './ZoomLevelControl.css';

export class ZoomLevelControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;

    onAdd(map: Map): HTMLElement {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group maplibregl-ctrl-zoom-level';
        this._container.innerHTML = 'Zoom : <span></span>';
        
        const span = this._container.querySelector('span')!;
        span.textContent = map.getZoom().toFixed(1);
        
        map.on('zoom', () => {
            span.textContent = map.getZoom().toFixed(1);
        });
        
        return this._container;
    }

    onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }
} 
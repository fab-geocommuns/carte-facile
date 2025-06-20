import { Map, IControl, ControlPosition } from 'maplibre-gl';
import '../../themes/styles/dsfr.css';
import './ZoomLevelControl.css';

export class ZoomLevelControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;
    private _label!: HTMLDivElement;
    private _value!: HTMLSpanElement;

    onAdd(map: Map): HTMLElement {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        this._label = document.createElement('div');
        this._label.className = 'cartefacile-ctrl-zoom-level';
        this._label.textContent = 'Zoom : ';
        this._value = document.createElement('span');
        this._value.textContent = map.getZoom().toFixed(1);
        this._container.appendChild(this._label);
        this._label.appendChild(this._value);
        
        map.on('zoom', () => {
            this._value.textContent = map.getZoom().toFixed(1);
        });
        
        return this._container;
    }

    onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }

    getDefaultPosition(): ControlPosition {
        return 'top-right';
    }
} 
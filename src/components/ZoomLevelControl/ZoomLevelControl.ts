import { Map, IControl, ControlPosition } from 'maplibre-gl';
import '../../themes/styles/dsfr.css';
import './ZoomLevelControl.css';

export class ZoomLevelControl implements IControl {
    private _map?: Map;
    private _ctrl!: HTMLDivElement;
    private _label!: HTMLDivElement;
    private _value!: HTMLSpanElement;

    onAdd(map: Map): HTMLElement {
        this._map = map;
        this._ctrl = document.createElement('div');
        this._ctrl.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        this._label = document.createElement('div');
        this._label.className = 'cartefacile-ctrl-zoom-level';
        this._label.textContent = 'Zoom : ';
        this._value = document.createElement('span');
        this._value.textContent = map.getZoom().toFixed(1);
        this._ctrl.appendChild(this._label);
        this._label.appendChild(this._value);
        
        map.on('zoom', () => {
            this._value.textContent = map.getZoom().toFixed(1);
        });
        
        return this._ctrl;
    }

    onRemove() {
        this._ctrl.parentNode?.removeChild(this._ctrl);
        this._map = undefined;
    }

    getDefaultPosition(): ControlPosition {
        return 'top-right';
    }
} 
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import { getMapStyle } from './styles';
import type { MapStyleType, MapProvider } from '../types/map';

export interface CarteFacileMapOptions extends Omit<maplibregl.MapOptions, 'style'> {
  style: MapStyleType;
  provider?: MapProvider;
}

export class Map extends maplibregl.Map {
  constructor(options: CarteFacileMapOptions) {
    const { style, provider = 'ign', ...mapOptions } = options;
    const mapStyle = getMapStyle(style, provider);

    super({
      ...mapOptions,
      style: mapStyle.style as StyleSpecification,
    });
  }
} 
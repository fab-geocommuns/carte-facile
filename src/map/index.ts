import maplibregl, { StyleSpecification } from 'maplibre-gl';
import { ignStyles } from './ign';
import type { MapStyle, MapStyleType, MapProvider } from './types';

const stylesByProvider: Record<MapProvider, Record<string, MapStyle>> = {
  ign: ignStyles,
  osm: {} // Préparé pour l'implémentation future
};

export function getMapStyle(type: MapStyleType, provider: MapProvider = 'ign'): MapStyle {
  const providerStyles = stylesByProvider[provider];
  if (!providerStyles) {
    throw new Error(`Provider ${provider} not supported`);
  }

  const style = providerStyles[type];
  if (!style) {
    throw new Error(`Style ${type} not found for provider ${provider}`);
  }

  return style;
}

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

// Export des types
export type { MapStyle, MapStyleType, MapProvider }; 
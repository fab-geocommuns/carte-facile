import { ignStyles } from './ign';
import { MapStyle, MapStyleType, MapProvider } from '../../types/map';

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

// Export des types
export type { MapStyle, MapStyleType, MapProvider }; 
import { ignStyles } from './ign';
import type { MapConfig, MapType, MapProvider } from './types';

const stylesByProvider: Record<MapProvider, Record<string, MapConfig>> = {
  ign: ignStyles,
  osm: {} // Préparé pour l'implémentation future
};

export function getMap(type: MapType, provider: MapProvider = 'ign'): MapConfig {
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
export type { MapConfig, MapType, MapProvider }; 
import { ignMaps } from './ign';
import type { MapConfig, MapType, MapProvider } from './types';

const mapsByProvider: Record<MapProvider, Record<string, MapConfig>> = {
  ign: ignMaps,
  osm: {} // Préparé pour l'implémentation future
};

/**
 * Récupère la configuration d'un style de carte
 * @param type Le type de carte (standard, desaturated, aerial)
 * @param provider Le fournisseur de carte (ign, osm)
 * @returns La configuration complète du style de carte
 */
export function getMap(type: MapType, provider: MapProvider = 'ign'): MapConfig {
  const providerMaps = mapsByProvider[provider];
  if (!providerMaps) {
    throw new Error(`Provider ${provider} not supported`);
  }

  const map = providerMaps[type];
  if (!map) {
    throw new Error(`Map ${type} not found for provider ${provider}`);
  }

  return map;
} 
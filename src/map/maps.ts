import { ignMaps } from './ign';
import { MapConfig, MapType, MapProvider } from './types';

const mapsByProvider: Record<MapProvider, Record<string, MapConfig>> = {
  [MapProvider.ign]: ignMaps,
  [MapProvider.osm]: {} // Préparé pour l'implémentation future
};

/**
 * Récupère la configuration d'un style de carte
 * @param type Le type de carte ('standard', 'desaturated', 'aerial')
 * @param provider Le fournisseur de carte ('ign', 'osm')
 * @returns La configuration complète du style de carte
 */
export function getMap(
  type: `${MapType}`,
  provider: `${MapProvider}` = 'ign'
): MapConfig {
  const providerMaps = mapsByProvider[provider as MapProvider];
  if (!providerMaps) {
    throw new Error(`Provider ${provider} not supported`);
  }

  const map = providerMaps[type as MapType];
  if (!map) {
    throw new Error(`Map ${type} not found for provider ${provider}`);
  }

  return map;
} 
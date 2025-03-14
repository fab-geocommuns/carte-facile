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
    const availableProviders = Object.values(MapProvider).join(', ');
    throw new Error(
      `Provider "${provider}" not supported. Available providers are: ${availableProviders}`
    );
  }

  const map = providerMaps[type as MapType];
  if (!map) {
    const availableTypes = Object.values(MapType).join(', ');
    throw new Error(
      `Map type "${type}" not found for provider "${provider}". Available map types are: ${availableTypes}`
    );
  }

  return map;
} 
import { ignMaps } from './ign';
import { MapConfig, MapType, MapProvider, Overlay } from './types';

// Maps by provider. Each provider has its own map style JSON files
const mapsByProvider: Record<MapProvider, Record<string, MapConfig>> = {
  [MapProvider.ign]: ignMaps,
  [MapProvider.osm]: {} // Prepared for future implementation
};

/**
 * Retrieves map style configuration
 * @param type Map type ('standard', 'desaturated', 'aerial')
 * @param provider The map provider ('ign', 'osm') 
 * @returns The complete map style configuration
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

/**
 * Returns a new style with modified overlay visibility
 * @param style Map style configuration
 * @param overlay Overlay to modify
 * @param visible true to show, false to hide
 * @returns New style configuration with updated layer visibility
 */
export function setOverlayVisibility(
  style: MapConfig,
  overlay: Overlay,
  visible: boolean
): MapConfig {
  return {
    ...style,
    layers: style.layers.map(layer => {
      if (layer.metadata?.overlay === overlay) {
        return {
          ...layer,
          layout: {
            ...layer.layout,
            visibility: visible ? 'visible' : 'none'
          }
        };
      }
      return layer;
    })
  };
} 
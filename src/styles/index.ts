import { ignStyles } from './ign';
import { MapStyle, MapStyleType, MapProvider } from '../types/map';

// Fonction utilitaire pour obtenir un style par type et fournisseur
export function getMapStyle(type: MapStyleType, provider: MapProvider = 'ign'): MapStyle {
  switch (provider) {
    case 'ign':
      return ignStyles[type];
    case 'osm':
      // TODO: Implémenter les styles OSM
      throw new Error('OSM styles not implemented yet');
    default:
      throw new Error(`Provider ${provider} not supported`);
  }
}

// Export des types
export type { MapStyle, MapStyleType, MapProvider }; 
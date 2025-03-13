export type MapType = 'desaturated' | 'standard' | 'aerial';
export type MapProvider = 'ign' | 'osm';

interface MapMetadata {
  fr: {
    name: string;
    description: string;
    use: string;
    accessibility: string;
  };
  en: {
    name: string;
    description: string;
    use: string;
    accessibility: string;
  };
  source: string;
  url: string;
  thumbnail: string;
  version: string;
}

export interface MapConfig {
  name: string;
  style: unknown; // Le style JSON qui peut être utilisé par différentes bibliothèques de cartes (MapLibre, Leaflet, OpenLayers)
  provider: MapProvider;
  metadata: MapMetadata;
} 
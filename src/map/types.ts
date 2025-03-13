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
  provider: MapProvider;
  metadata: MapMetadata;
} 
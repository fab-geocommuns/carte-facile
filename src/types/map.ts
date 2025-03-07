export type MapStyleType = 'desaturated' | 'standard' | 'aerial';
export type MapProvider = 'ign' | 'osm';

interface StyleMetadata {
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

export interface MapStyle {
  name: string;
  style: any; // Le style JSON de MapLibre
  provider: MapProvider;
  metadata: StyleMetadata;
} 
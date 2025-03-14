//Card types available. Used as a single source of truth for card identifiers 
export enum MapType {
  desaturated = 'desaturated',
  standard = 'standard',
  aerial = 'aerial'
}

// Card providers available. Used as a single source of truth for provider identifiers 
export enum MapProvider {
  ign = 'ign',
  osm = 'osm'
}

// Map metadata, availables in JSON map style files
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
  version: string;
}

// Merge all elements of the map configuration
export interface MapConfig {
  name: string;
  provider: MapProvider;
  metadata: MapMetadata;
  thumbnail: string;
}
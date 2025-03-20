/**
 * Available map types
 */
export enum MapType {
  desaturated = 'desaturated',
  standard = 'standard',
  aerial = 'aerial'
}

/**
 * Available map providers
 */
export enum MapProvider {
  ign = 'ign',
  osm = 'osm'
}

/**
 * Layer configuration following Mapbox/Maplibre specification
 */
export interface LayerConfig {
  id: string;
  type: string;
  metadata?: {
    overlay?: string;
    [key: string]: unknown;
  };
  layout?: {
    visibility?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Map configuration following Mapbox/Maplibre specification
 */
export interface MapConfig {
  version: number;
  name: string;
  provider: MapProvider;
  metadata: {
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
    [key: string]: unknown;
  };
  thumbnail: string;
  center?: number[];
  zoom?: number;
  sources?: Record<string, unknown>;
  sprite?: string;
  glyphs?: string;
  layers: LayerConfig[];
  [key: string]: unknown;
}

/**
 * Layer configuration following Mapbox/Maplibre specification
 */
export interface LayerConfig {
  id: string;
  type: string;
  metadata?: {
    group?: string;
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
export interface StyleConfig {
  name: string;
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
    [key: string]: unknown;
  };
  center?: number[];
  zoom?: number;
  sources?: Record<string, unknown>;
  sprite?: string;
  glyphs?: string;
  layers: LayerConfig[];
  [key: string]: unknown;
}

/**
 * Map style configuration
 */
export type MapStyle = {
  ign: {
    desaturated: StyleConfig;
    simple: StyleConfig;
    aerial: StyleConfig;
  }
/*   osm: {
    standard: MapConfig;
    desaturated: MapConfig;
    aerial: MapConfig;
  } */
}

/**
 * Map thumbnails configuration
 */
export type MapThumbnails = {
  desaturated: string;
  simple: string;
  aerial: string;
}


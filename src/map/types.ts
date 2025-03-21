
// créer un enum des layers -> permet aussi de créer de la doc dessus en hover par exemple -> voir comment ajouter de la doc dans les enums.

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
  version: number;
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
    source: string;
    url: string;
    version: string;
    [key: string]: unknown;
  };
  thumbnail?: string;
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
    standard: StyleConfig;
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
  standard: string;
  aerial: string;
}


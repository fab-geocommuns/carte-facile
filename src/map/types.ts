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
export type MapStyles = {
  simple: StyleConfig;
  simpleOsm: StyleConfig;
  aerial: StyleConfig;
  desaturated: StyleConfig;
}

/**
 * Map thumbnails configuration
 */
export type MapThumbnails = {
  simple: string;
  simpleOsm: string;
  aerial: string;
  desaturated: string;
  cadastre: string;
  administrativeBoundaries: string;
}

// Types pour la gestion mutualisée des overlays (refonte sémantique)
export type OverlayVariant = 'neutral' | 'color';
export type OverlayType = 'cadastre' | 'administrativeBoundaries';

export interface OverlayConfig {
  sources: Record<string, any>;
  metadata?: Record<string, any>;
  layers: LayerConfig[];
}

export type MapOverlays = {
  [key in OverlayType]: {
    [variant in OverlayVariant]: OverlayConfig
  }
};


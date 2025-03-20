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
 * Available map overlays
 */
export enum Overlay {
  adminLimits = 'admin_limits',
  cadastre = 'cadastre',
}

/**
 * Layer metadata following Mapbox/Maplibre specification
 */
export interface LayerMetadata {
  overlay?: string;
  [key: string]: unknown;
}

/**
 * Layer configuration following Mapbox/Maplibre specification
 */
export interface Layer {
  id: string;
  type: string;
  metadata?: LayerMetadata;
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
  layers: Layer[];
  [key: string]: unknown;
}
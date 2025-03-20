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

// Available overlay types. Used as a single source of truth for overlay identifiers
export enum Overlay {
  adminLimits = 'admin-limits',
  cadastre = 'cadastre',
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

// Layer metadata for overlays
export interface LayerMetadata {
  overlay?: Overlay;
}

// Layer configuration
export interface Layer {
  id: string;
  type: string;
  metadata?: LayerMetadata;
  layout: {
    visibility?: 'visible' | 'none';
  };
  // Allows any other properties from the map style specification
  [key: string]: unknown;
}

// Configuration des overlays
export type OverlayState = Record<Overlay, boolean>;

// Merge all elements of the map configuration
export interface MapConfig {
  name: string;
  provider: MapProvider;
  metadata: MapMetadata;
  thumbnail: string;
  style: {
    layers: Layer[];
  };
}
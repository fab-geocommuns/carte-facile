/**
 * Layer configuration following Mapbox/Maplibre specification
 */
export interface LayerConfig {
  id: string;
  type: string;
  metadata?: {
    'cartefacile:group'?: string;
    [key: string]: unknown;
  };
  layout?: {
    visibility?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Types pour la gestion mutualisée des overlays
export type OverlayVariant = 'neutral' | 'color';
export type OverlayType = 'cadastre' | 'administrativeBoundaries' | 'levelCurves';

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


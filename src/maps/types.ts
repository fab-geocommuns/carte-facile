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

/**
 * Overlay configuration types
 * Used for overlay management
 */
export const Overlay = {
  cadastre: 'cadastre',
  administrativeBoundaries: 'administrativeBoundaries',
  levelCurves: 'levelCurves',
} as const;

export type OverlayType = typeof Overlay[keyof typeof Overlay];

export type OverlayVariant = 'neutral' | 'color';

export interface OverlayConfig {
  sources: Record<string, any>;
  metadata?: Record<string, any>;
  layers: any[];
}

export type MapOverlays = {
  [key in OverlayType]: {
    [variant in OverlayVariant]: OverlayConfig
  }
};

/**
 * List of layer groups available
 * Used for layer visibility management
 */
export const LayerGroup = {
  cadastral_sections: 'cadastral_sections',
  cadastral_parcels: 'cadastral_parcels',
  boundaries_communes: 'boundaries_communes',
  boundaries_epcis: 'boundaries_epcis',
  boundaries_departments: 'boundaries_departments',
  boundaries_regions: 'boundaries_regions',
  boundaries: 'boundaries',
  buildings: 'buildings',
  streets: 'streets',
  street_labels: 'street_labels',
} as const;

export type LayerGroupType = typeof LayerGroup[keyof typeof LayerGroup];


import { OverlayType, OverlayVariant, MapOverlays, LayerConfig, LayerGroup, LayerGroupType } from './types';
import type { StyleSpecification } from 'maplibre-gl';

// Import IGN map styles
import desaturatedIgn from './desaturated.json';
import simpleIgn from './simple.json';
import aerialIgn from './aerial.json';
// Import OSM map styles
import simpleOsm from './simple-osm.json';
/* import desaturatedOsm from './desaturated-osm.json';*/

/**
 * Map styles configuration
 * Each style is a complete MapLibre style configuration
 */
export const mapStyles = {
  simple: simpleIgn as StyleSpecification,
  simpleOsm: simpleOsm as StyleSpecification,
  aerial: aerialIgn as StyleSpecification,
  desaturated: desaturatedIgn as StyleSpecification
};

/**
 * @deprecated Use mapStyles instead. This will be removed in the next major version.
 */
export const mapStyle = mapStyles;

// Import map thumbnails
import simpleThumb from '../assets/thumbnails/simple.webp';
import aerialThumb from '../assets/thumbnails/aerial.webp';
import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import cadastreThumb from '../assets/thumbnails/cadastre.webp';
import administrativeBoundariesThumb from '../assets/thumbnails/administrative-boundaries.webp';
import levelCurvesThumb from '../assets/thumbnails/level-curves.webp';

/**
 * Map thumbnails configuration
 * Used for style selection UI
 */
export const mapThumbnails = {
  simple: simpleThumb,
  simpleOsm: simpleThumb,
  aerial: aerialThumb,
  desaturated: desaturatedThumb,
  cadastre: cadastreThumb,
  administrativeBoundaries: administrativeBoundariesThumb,
  levelCurves: levelCurvesThumb,
} as const;

// Import shared overlay configurations
import cadastreCommon from './overlays/cadastre/common.json';
import cadastreNeutralLayers from './overlays/cadastre/neutral.layers.json';
import cadastreColorLayers from './overlays/cadastre/color.layers.json';

import adminCommon from './overlays/administrative-boundaries/common.json';
import adminNeutralLayers from './overlays/administrative-boundaries/neutral.layers.json';
import adminColorLayers from './overlays/administrative-boundaries/color.layers.json';

import levelsCommon from './overlays/level-curves/common.json';
import levelsNeutralLayers from './overlays/level-curves/neutral.layers.json';
import levelsColorLayers from './overlays/level-curves/color.layers.json';

/**
 * Overlay configurations
 * Each overlay has two variants:
 * - neutral: for standard map styles (simple, desaturated)
 * - color: for aerial map style
 */
export const overlayConfigurations = {
  cadastre: {
    neutral: { ...cadastreCommon, layers: cadastreNeutralLayers },
    color: { ...cadastreCommon, layers: cadastreColorLayers }
  },
  administrativeBoundaries: {
    neutral: { ...adminCommon, layers: adminNeutralLayers },
    color: { ...adminCommon, layers: adminColorLayers }
  },
  levelCurves: {
    neutral: { ...levelsCommon, layers: levelsNeutralLayers },
    color: { ...levelsCommon, layers: levelsColorLayers }
  }
} as const;

/**
 * Gets the appropriate overlay variant based on the current map style
 */
function getOverlayVariant(map: maplibregl.Map): OverlayVariant {
  return map.getStyle().name === 'aerial' ? 'color' : 'neutral';
}

/**
 * Adds an overlay to the map
 * @param map - The MapLibre map instance
 * @param type - The type of overlay to add (cadastre or administrative-boundaries)
 */
export function addOverlay(map: maplibregl.Map, type: OverlayType): void {
  const update = () => {
    const overlay = overlayConfigurations[type][getOverlayVariant(map)];
    Object.entries(overlay.sources).forEach(([id, source]) => {
      if (!map.getSource(id)) map.addSource(id, source as any);
    });
    overlay.layers.forEach(layer => {
      if (!map.getLayer(layer.id)) map.addLayer(layer as any);
    });
  };

  if (map.loaded()) update();
  else map.once('load', update);
  
  // Store the update function on the map instance for this overlay type
  (map as any)[`_overlay_update_${type}`] = update;
  map.on('styledata', update);
}

/**
 * Removes an overlay from the map
 * @param map - The MapLibre map instance
 * @param type - The type of overlay to remove (cadastre, administrative-boundaries, or level-curves)
 */
export function removeOverlay(map: maplibregl.Map, type: OverlayType): void {
  const overlay = overlayConfigurations[type][getOverlayVariant(map)];
  
  // Remove all layers from this overlay
  overlay.layers.forEach(layer => {
    if (map.getLayer(layer.id)) {
      map.removeLayer(layer.id);
    }
  });

  // Remove all sources from this overlay
  Object.keys(overlay.sources).forEach(sourceId => {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });

  // Remove the styledata event listener for this overlay
  const update = (map as any)[`_overlay_update_${type}`];
  if (update) {
    map.off('styledata', update);
    delete (map as any)[`_overlay_update_${type}`];
  }
}

/**
 * Show the specified layer groups
 * @param map - The MapLibre map instance
 * @param groups - List of layer groups to show
 */
export function showLayers(
  map: maplibregl.Map,
  groups: LayerGroupType[]
): void {
  if (!map.loaded()) {
    map.once('load', () => showLayers(map, groups));
    return;
  }

  map.getStyle().layers?.forEach(layer => {
    const group = (layer as LayerConfig).metadata?.['cartefacile:group'];
    if (group && groups.includes(group as LayerGroupType)) {
      map.setLayoutProperty(layer.id, 'visibility', 'visible');
    }
  });
}

/**
 * Hide the specified layer groups
 * @param map - The MapLibre map instance
 * @param groups - List of layer groups to hide
 */
export function hideLayers(
  map: maplibregl.Map,
  groups: LayerGroupType[]
): void {
  if (!map.loaded()) {
    map.once('load', () => hideLayers(map, groups));
    return;
  }

  map.getStyle().layers?.forEach(layer => {
    const group = (layer as LayerConfig).metadata?.['cartefacile:group'];
    if (group && groups.includes(group as LayerGroupType)) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
  });
}
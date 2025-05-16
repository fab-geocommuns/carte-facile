import { MapStyles, MapThumbnails, OverlayType, OverlayVariant, MapOverlays } from './types';

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
export const mapStyles: MapStyles = {
  simple: simpleIgn,
  desaturated: desaturatedIgn,
  aerial: aerialIgn,
  simpleOsm: simpleOsm
}

/**
 * @deprecated Use mapStyles instead. This will be removed in the next major version.
 */
export const mapStyle = mapStyles;

// Import map thumbnails
import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import simpleThumb from '../assets/thumbnails/simple.webp';
import aerialThumb from '../assets/thumbnails/aerial.webp';

/**
 * Map thumbnails configuration
 * Used for style selection UI
 */
export const mapThumbnails: MapThumbnails = {
  desaturated: desaturatedThumb,
  simple: simpleThumb,
  aerial: aerialThumb,
  simpleOsm: simpleThumb,
}

// Import shared overlay configurations
import cadastreCommon from './overlays/cadastre/common.json';
import cadastreNeutralLayers from './overlays/cadastre/neutral.layers.json';
import cadastreColorLayers from './overlays/cadastre/color.layers.json';

import adminCommon from './overlays/administrative-boundaries/common.json';
import adminNeutralLayers from './overlays/administrative-boundaries/neutral.layers.json';
import adminColorLayers from './overlays/administrative-boundaries/color.layers.json';

/**
 * Overlay configurations
 * Each overlay has two variants:
 * - neutral: for standard map styles (simple, desaturated)
 * - color: for aerial map style
 */
export const mapOverlays: MapOverlays = {
  cadastre: {
    neutral: { ...cadastreCommon, layers: cadastreNeutralLayers },
    color: { ...cadastreCommon, layers: cadastreColorLayers }
  },
  'administrative-boundaries': {
    neutral: { ...adminCommon, layers: adminNeutralLayers },
    color: { ...adminCommon, layers: adminColorLayers }
  }
};

/**
 * Gets the appropriate overlay variant based on the current map style
 */
function getOverlayVariant(map: maplibregl.Map): OverlayVariant {
  const baseMapType = map.getStyle().name as 'simple' | 'desaturated' | 'aerial' | 'simpleOsm';
  return baseMapType === 'aerial' ? 'color' : 'neutral';
}

/**
 * Adds an overlay to the map
 * @param map - The MapLibre map instance
 * @param type - The type of overlay to add (cadastre or administrative-boundaries)
 */
export function addOverlay(map: maplibregl.Map, type: OverlayType): void {
  const update = () => {
    const overlay = mapOverlays[type][getOverlayVariant(map)];
    Object.entries(overlay.sources).forEach(([id, source]) => {
      if (!map.getSource(id)) map.addSource(id, source as any);
    });
    overlay.layers.forEach(layer => {
      if (!map.getLayer(layer.id)) map.addLayer(layer as any);
    });
  };

  if (map.loaded()) update();
  else map.once('load', update);
  
  map.on('style.load', update);
}

/**
 * Removes an overlay from the map
 * @param map - The MapLibre map instance
 * @param type - The type of overlay to remove (cadastre or administrative-boundaries)
 */
export function removeOverlay(map: maplibregl.Map, type: OverlayType): void {
  const update = () => {
    const overlay = mapOverlays[type][getOverlayVariant(map)];
    overlay.layers.forEach(layer => {
      if (map.getLayer(layer.id)) map.removeLayer(layer.id);
    });
    Object.keys(overlay.sources).forEach(id => {
      if (map.getSource(id)) map.removeSource(id);
    });
  };

  if (map.loaded()) update();
  else map.once('load', update);
  
  map.off('style.load', update);
}
import { MapStyles, MapThumbnails, OverlayType, OverlayVariant, MapOverlays } from './types';

// Map styles import for IGN
import desaturatedIgn from './desaturated.json';
import simpleIgn from './simple.json';
import aerialIgn from './aerial.json';
// Map styles import for OSM
import simpleOsm from './simple-osm.json';
/* import desaturatedOsm from './desaturated-osm.json';*/

// Map styles choices
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

  // Map thumbnails import
import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import simpleThumb from '../assets/thumbnails/simple.webp';
import aerialThumb from '../assets/thumbnails/aerial.webp';

// Map thumbnails choices
export const mapThumbnails: MapThumbnails = {
  desaturated: desaturatedThumb,
  simple: simpleThumb,
  aerial: aerialThumb,
  simpleOsm: simpleThumb,
}

// Shared overlays (cadastre and administrative boundaries)
import cadastreCommon from './overlays/cadastre/common.json';
import cadastreNeutralLayers from './overlays/cadastre/neutral.layers.json';
import cadastreColorLayers from './overlays/cadastre/color.layers.json';

import adminCommon from './overlays/administrative-boundaries/common.json';
import adminNeutralLayers from './overlays/administrative-boundaries/neutral.layers.json';
import adminColorLayers from './overlays/administrative-boundaries/color.layers.json';

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

export function addOverlay(map: maplibregl.Map, type: OverlayType): void {
  const baseMapType = map.getStyle().name as 'simple' | 'desaturated' | 'aerial' | 'simpleOsm';
  const overlayVariant: OverlayVariant = baseMapType === 'aerial' ? 'color' : 'neutral';
  const overlay = mapOverlays[type][overlayVariant];

  Object.entries(overlay.sources).forEach(([id, source]) => {
    if (!map.getSource(id)) map.addSource(id, source as any);
  });

  overlay.layers.forEach(layer => {
    if (!map.getLayer(layer.id)) map.addLayer(layer as any);
  });
}

export function removeOverlay(map: maplibregl.Map, type: OverlayType): void {
  const baseMapType = map.getStyle().name as 'simple' | 'desaturated' | 'aerial' | 'simpleOsm';
  const overlayVariant: OverlayVariant = baseMapType === 'aerial' ? 'color' : 'neutral';
  const overlay = mapOverlays[type][overlayVariant];

  overlay.layers.forEach(layer => {
    if (map.getLayer(layer.id)) map.removeLayer(layer.id);
  });

  Object.keys(overlay.sources).forEach(id => {
    if (map.getSource(id)) map.removeSource(id);
  });
}
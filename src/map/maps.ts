import { MapStyle, MapThumbnails } from './types';

// Map styles import for IGN
import desaturatedIgn from './ign/desaturated_ign.json';
import simpleIgn from './ign/simple_ign.json';
import aerialIgn from './ign/aerial_ign.json';

// Map styles import for OSM
/* import simpleOsm from './osm/standard_osm.json';
import desaturatedOsm from './osm/desaturated_osm.json';
import aerialOsm from './osm/aerial-photography_osm.json'; */

// Map thumbnails import
import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import simpleThumb from '../assets/thumbnails/simple.webp';
import aerialThumb from '../assets/thumbnails/aerial.webp';

// Map styles choices
export const mapStyle: MapStyle = {
  simple: simpleIgn,
  desaturated: desaturatedIgn,
  aerial: aerialIgn
}

/* export const osmMapStyle = {
  simple: simpleOsm,
  desaturated: desaturatedOsm,
  aerial: aerialOsm
} */

// Map thumbnails choices
export const mapThumbnails: MapThumbnails = {
  desaturated: desaturatedThumb,
  simple: simpleThumb,
  aerial: aerialThumb
}
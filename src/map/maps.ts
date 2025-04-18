import { MapStyle, MapThumbnails } from './types';

// Map styles import for IGN
import desaturatedIgn from './desaturated.json';
import simpleIgn from './simple.json';
import aerialIgn from './aerial.json';

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
import { MapStyle, MapThumbnails } from './types';

// Map styles import for IGN
import desaturatedIgn from './desaturated.json';
import simpleIgn from './simple.json';
import aerialIgn from './aerial.json';

// Map styles import for OSM
import simpleOsm from './simple-osm.json';
/* import desaturatedOsm from './desaturated-osm.json';*/

// Map thumbnails import
import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import simpleThumb from '../assets/thumbnails/simple.webp';
import aerialThumb from '../assets/thumbnails/aerial.webp';

// Map styles choices
export const mapStyle: MapStyle = {
  simple: simpleIgn,
  desaturated: desaturatedIgn,
  aerial: aerialIgn,
  simpleOsm: simpleOsm
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
  aerial: aerialThumb,
  simpleOsm: simpleThumb,
}
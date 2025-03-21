import { MapStyle, MapThumbnails } from './types';

// Map styles import for IGN
import desaturatedIgn from './ign/desaturated_ign.json';
import standardIgn from './ign/standard_ign.json';
import aerialPhotographyIgn from './ign/aerial-photography_ign.json';

// Map styles import for OSM
/* import standardOsm from './osm/standard_osm.json';
import desaturatedOsm from './osm/desaturated_osm.json';
import aerialOsm from './osm/aerial-photography_osm.json'; */

// Map thumbnails import
import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import standardThumb from '../assets/thumbnails/standard.webp';
import aerialPhotographyThumb from '../assets/thumbnails/aerial-photography.webp';

// Map styles choices
export const mapStyle: MapStyle = {
  ign: {
    standard: standardIgn,
    desaturated: desaturatedIgn,
    aerialPhotography: aerialPhotographyIgn,
  },
/*   osm: {
    standard: standardOsm,
    desaturated: desaturatedOsm,
    aerial: aerialOsm,
  } */
}

// Map thumbnails choices
export const mapThumbnails: MapThumbnails = {
  desaturated: desaturatedThumb,
  standard: standardThumb,
  aerialPhotography: aerialPhotographyThumb
}
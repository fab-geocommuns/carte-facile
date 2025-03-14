import desaturated from './desaturated_ign.json';
import standard from './standard_ign.json';
import aerial from './aerial-photography_ign.json';
import { MapConfig } from '../types';
import { MAP_THUMBNAILS } from '../thumbnails';

export const ignMaps: Record<string, MapConfig> = {
  desaturated: {
    ...desaturated,
    provider: 'ign',
    thumbnail: MAP_THUMBNAILS.desaturated
  },
  standard: {
    ...standard,
    provider: 'ign',
    thumbnail: MAP_THUMBNAILS.standard
  },
  aerial: {
    ...aerial,
    provider: 'ign',
    thumbnail: MAP_THUMBNAILS.aerial
  }
};
import desaturated from './desaturated_ign.json';
import standard from './standard_ign.json';
import aerial from './aerial-photography_ign.json';
import { MapConfig, MapType, MapProvider } from '../types';
import { mapThumbnails } from '../thumbnails';

export const ignMaps: Record<string, MapConfig> = {
  [MapType.desaturated]: {
    ...desaturated,
    provider: MapProvider.ign,
    thumbnail: mapThumbnails[MapType.desaturated]
  },
  [MapType.standard]: {
    ...standard,
    provider: MapProvider.ign,
    thumbnail: mapThumbnails[MapType.standard]
  },
  [MapType.aerial]: {
    ...aerial,
    provider: MapProvider.ign,
    thumbnail: mapThumbnails[MapType.aerial]
  }
};
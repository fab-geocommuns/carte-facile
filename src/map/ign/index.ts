import desaturated from './desaturated_ign.json';
import standard from './standard_ign.json';
import aerial from './aerial-photography_ign.json';
import { MapConfig } from '../types';

export const ignMaps: Record<string, MapConfig> = {
  desaturated: {
    ...desaturated,
    provider: 'ign'
  },
  standard: {
    ...standard,
    provider: 'ign'
  },
  aerial: {
    ...aerial,
    provider: 'ign'
  }
}; 
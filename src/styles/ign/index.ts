import desaturated from './desaturated_ign.json';
import standard from './standard_ign.json';
import aerial from './aerial-photography_ign.json';
import { MapStyle } from '../../types/map';

export const ignStyles: Record<string, MapStyle> = {
  desaturated: {
    name: desaturated.name,
    style: desaturated,
    provider: 'ign',
    metadata: desaturated.metadata
  },
  standard: {
    name: standard.name,
    style: standard,
    provider: 'ign',
    metadata: standard.metadata
  },
  aerial: {
    name: aerial.name,
    style: aerial,
    provider: 'ign',
    metadata: aerial.metadata
  }
}; 
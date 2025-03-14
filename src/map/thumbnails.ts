import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import standardThumb from '../assets/thumbnails/standard.webp';
import aerialThumb from '../assets/thumbnails/aerial-photography.webp';
import { MapType } from './types';

/**
 * Thumbnails pour les différents styles de carte
 * Ces thumbnails sont partagés entre les différents providers (IGN, OSM, etc.)
 * car ils représentent le même style visuel, indépendamment du provider
 */
export const mapThumbnails: Record<MapType, string> = {
  [MapType.desaturated]: desaturatedThumb,
  [MapType.standard]: standardThumb,
  [MapType.aerial]: aerialThumb
} as const; 
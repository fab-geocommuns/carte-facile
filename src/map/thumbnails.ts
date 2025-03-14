import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import standardThumb from '../assets/thumbnails/standard.webp';
import aerialThumb from '../assets/thumbnails/aerial-photography.webp';
import { MapType } from './types';

/**
 * Thumbnails for different map styles
 * These thumbnails are shared between different providers (IGN, OSM, etc.)
because they represent the same visual style, regardless of provider
 */
export const mapThumbnails: Record<MapType, string> = {
  [MapType.desaturated]: desaturatedThumb,
  [MapType.standard]: standardThumb,
  [MapType.aerial]: aerialThumb
} as const; 
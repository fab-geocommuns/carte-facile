import desaturatedThumb from '../assets/thumbnails/desaturated.webp';
import standardThumb from '../assets/thumbnails/standard.webp';
import aerialThumb from '../assets/thumbnails/aerial-photography.webp';

export const MAP_THUMBNAILS = {
  desaturated: desaturatedThumb,
  standard: standardThumb,
  aerial: aerialThumb
} as const;

// Type utilitaire pour récupérer les clés des thumbnails
export type MapThumbnailKey = keyof typeof MAP_THUMBNAILS; 
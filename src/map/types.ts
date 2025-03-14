/**
 * Types de cartes disponibles
 * Utilisé comme source unique de vérité pour les identifiants de cartes
 */
export enum MapType {
  desaturated = 'desaturated',
  standard = 'standard',
  aerial = 'aerial'
}

/**
 * Fournisseurs de cartes disponibles
 * Utilisé comme source unique de vérité pour les identifiants de providers
 */
export enum MapProvider {
  ign = 'ign',
  osm = 'osm'
}

interface MapMetadata {
  fr: {
    name: string;
    description: string;
    use: string;
    accessibility: string;
  };
  en: {
    name: string;
    description: string;
    use: string;
    accessibility: string;
  };
  source: string;
  url: string;
  thumbnail: string;
  version: string;
}

export interface MapConfig {
  name: string;
  provider: MapProvider;
  metadata: MapMetadata;
  thumbnail: string;
}
/**
 * Gestionnaire de thème pour Carte Facile
 */
type ThemeType = 'default' | 'dsfr';

export class Theme {
  private static _theme: ThemeType = 'default';
  
  /**
   * Applique le thème sur une carte MapLibre
   */
  static applyToMap(map: maplibregl.Map, theme: ThemeType = 'default') {
    this._theme = theme;
    map.getContainer().setAttribute('data-theme', theme);
  }
  
  /**
   * Récupère le thème actuel
   */
  static getTheme(): ThemeType {
    return this._theme;
  }
} 
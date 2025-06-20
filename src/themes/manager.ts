/**
 * Gestionnaire de thème global pour Carte Facile
 */
class Theme {
  private static _theme: 'default' | 'dsfr' = 'default';
  
  /**
   * Définit le thème global pour tous les composants
   */
  static setTheme(theme: 'default' | 'dsfr') {
    this._theme = theme;
  }
  
  /**
   * Récupère le thème global actuel
   */
  static getTheme(): 'default' | 'dsfr' {
    return this._theme;
  }
}

export { Theme }; 
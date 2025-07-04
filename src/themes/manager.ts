/**
 * Gestionnaire de thème pour Carte Facile
 */
type ThemeType = 'default' | 'dsfr';

let currentTheme: ThemeType = 'default';

/**
 * Applique le thème sur une carte MapLibre
 */
export function setTheme(map: maplibregl.Map, theme: ThemeType = 'default') {
  currentTheme = theme;
  map.getContainer().setAttribute('data-theme', theme);
}
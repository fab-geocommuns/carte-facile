/**
 * Gestionnaire de thème pour Carte Facile
 */
type ThemeType = "default" | "dsfr"

/**
 * Applique le thème sur une carte MapLibre
 */
export function setTheme(
	map: maplibregl.Map,
	theme: ThemeType = "default"
): void {
	map.getContainer().setAttribute("data-theme", theme)
}

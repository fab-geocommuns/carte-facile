import type { Map as MapLibreMap } from "maplibre-gl"

/**
 * Gestionnaire de thème pour Carte Facile
 */
type ThemeType = "default" | "dsfr"

/**
 * Applique le thème sur une carte MapLibre
 */
export function setTheme(map: MapLibreMap, theme: ThemeType = "default"): void {
	map.getContainer().setAttribute("data-theme", theme)
}

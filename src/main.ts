import {
	GeolocateControl,
	Map as MapLibre,
	NavigationControl
} from "maplibre-gl"
import {
	MapSelectorControl,
	mapStyles,
	SearchControl,
	ZoomLevelControl
} from "./index"
import "./themes/styles/style.css"

// Création la carte
const map = new MapLibre({
	container: "map", // id du conteneur de la carte
	style: mapStyles.simple, // Style de carte
	//minZoom: 1.8, // niveau de zoom minimum (optionnel)
	maxZoom: 18.9 // niveau de zoom maximum, adapté aux cartes utilisant les données IGN
})

//CarteFacile.setTheme(map, 'dsfr');
map.addControl(new ZoomLevelControl())
map.addControl(new NavigationControl())
map.addControl(new GeolocateControl({}))
//map.addControl(new maplibregl.GlobeControl);
//map.addControl(new maplibregl.TerrainControl);
map.addControl(new MapSelectorControl())
/* map.addControl(new CarteFacile.MapSelectorControl({
        styles: ['simple', 'aerial'],
        overlays: ['administrativeBoundaries', 'cadastre']
      }), 'bottom-left'); */

map.addControl(
	new SearchControl({
		onSelect: (result) => {
			// TODO: type result.data
			const properties = result.data.properties // Données transmises par l'API
			console.log(properties) // Afficher les données dans la console
			console.log(properties.citycode) // Afficher dans la console le code INSEE
		}
	})
)

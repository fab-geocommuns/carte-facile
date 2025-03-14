# Exemples d'utilisation basique

Ce guide présente des exemples simples d'utilisation de Carte Facile avec différentes bibliothèques de cartographie.

## Exemple avec MapLibre

### HTML
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Carte Facile - Exemple MapLibre</title>
    <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
    <style>
        #map { height: 500px; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script type="module" src="app.js"></script>
</body>
</html>
```

### JavaScript (app.js)
```javascript
import { getMap } from 'carte-facile';
import maplibregl from 'maplibre-gl';

// Initialisation de la carte
const map = new maplibregl.Map({
    container: 'map',
    style: getMap('standard', 'ign').style,
});

// Ajout d'un marqueur
const marker = new maplibregl.Marker()
    .setLngLat([2.3522, 48.8566])
    .addTo(map);

// Ajout d'une popup
const popup = new maplibregl.Popup()
    .setLngLat([2.3522, 48.8566])
    .setHTML('<h3>Paris</h3>')
    .addTo(map);
```
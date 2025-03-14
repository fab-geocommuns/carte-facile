# Guide MapLibre

Ce guide détaille l'utilisation de Carte Facile avec MapLibre GL JS.

## Installation

```bash
npm install carte-facile maplibre-gl
```

N'oubliez pas d'inclure les styles CSS de MapLibre :

```typescript
import 'maplibre-gl/dist/maplibre-gl.css';
```

## Utilisation basique

### Initialisation de la carte

```typescript
import { getMap } from 'carte-facile';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  style: getMap('standard', 'ign'),
});
```

### Contrôles personnalisés

```typescript
// Ajout d'un contrôle de navigation
map.addControl(new maplibregl.NavigationControl());

// Ajout d'une échelle
map.addControl(new maplibregl.ScaleControl({
  maxWidth: 100,
  unit: 'metric'
}));
```

### Événements de la carte

```typescript
map.on('load', () => {
  console.log('Carte chargée');
});

map.on('click', (e) => {
  console.log('Click sur la carte :', e.lngLat);
});
```

## Fonctionnalités avancées

### Ajout de marqueurs

```typescript
// Marqueur simple
const marker = new maplibregl.Marker()
  .setLngLat([2.3522, 48.8566])
  .addTo(map);

// Marqueur personnalisé
const element = document.createElement('div');
element.className = 'custom-marker';
const customMarker = new maplibregl.Marker({
  element: element,
  anchor: 'bottom'
})
  .setLngLat([2.3522, 48.8566])
  .addTo(map);
```

### Ajout de popups

```typescript
const popup = new maplibregl.Popup()
  .setLngLat([2.3522, 48.8566])
  .setHTML('<h3>Paris</h3><p>La ville lumière</p>')
  .addTo(map);
```

### Gestion des sources de données

```typescript
map.on('load', () => {
  // Ajout d'une source GeoJSON
  map.addSource('points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [2.3522, 48.8566]
          },
          properties: {
            title: 'Paris'
          }
        }
      ]
    }
  });

  // Ajout d'une couche utilisant cette source
  map.addLayer({
    id: 'points',
    type: 'circle',
    source: 'points',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff0000'
    }
  });
});
```

## Bonnes pratiques

### Performance

```typescript
// Désactiver le rendu pendant les modifications
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

// Limiter le framerate
map.setMaxFPS(30);
```

### Gestion de la mémoire

```typescript
// Nettoyage des ressources
function cleanup() {
  map.remove();
  // Supprimer les références aux marqueurs, popups, etc.
}
```

### Responsive Design

```typescript
// Gérer le redimensionnement
window.addEventListener('resize', () => {
  map.resize();
});
```

## Dépannage

### Problèmes courants

1. **La carte ne s'affiche pas**
   - Vérifiez que le conteneur a une hauteur définie
   - Assurez-vous que les styles CSS sont bien importés

2. **Les tuiles ne se chargent pas**
   - Vérifiez votre connexion internet
   - Assurez-vous que le style est correctement configuré

3. **Performances faibles**
   - Réduisez le nombre de marqueurs et de sources
   - Utilisez la clusterisation pour les grands ensembles de données 
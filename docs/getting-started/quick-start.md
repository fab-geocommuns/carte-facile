# Guide de démarrage rapide

Ce guide vous permettra de créer votre première carte avec Carte Facile en quelques instants.

## Configuration de base

1. Créez un conteneur HTML pour votre carte :

```html
<div id="map" style="height: 500px; width: 100%;"></div>
```

2. Importez et initialisez Carte Facile :

### Avec MapLibre

```typescript
import { getMap } from 'carte-facile';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map',
  style: getMap('standard', 'ign'),
});
```

## Personnalisation rapide

### Changer le type de carte

```typescript
// Style désaturé
getMap('desaturated', 'ign');

// Style aerial
getMap('aerial', 'ign');
```

### Cartes disponibles

Carte Facile propose plusieurs cartes prédéfinies :

| Carte | Description |
|-------|-------------|
| `standard` | Style par défaut, adapté à la plupart des usages |
| `desaturated` | Version désaturée, idéale pour la datavisualisation |
| `aerial` | Vue photographies aériennes et satellite |

### Fournisseurs de données

Les cartes puevent fonctionner avec différentes sources de données :

| Fournisseur | Description | Disponibilité |
|-------------|-------------|-----------------|
| `ign` | Institut Géographique National (France) | ✅ Oui |
| `osm` | OpenStreetMap (Monde) | 🛠️ À venir |


## Prochaines étapes

- Consultez la [documentation complète de l'API](/docs/api/)
<!-- - Explorez les [exemples](/docs/examples/basique-usage.md) -->
<!-- - Découvrez les [guides spécifiques](/docs/guides/maplibre.md) pour chaque bibliothèque de cartographie  -->
# Carte Facile

Une bibliothèque simple pour gérer les styles de cartes, compatible avec différentes bibliothèques de cartographie (MapLibre, Leaflet, OpenLayers).

## Installation

```bash
npm install carte-facile
```

## Prérequis

En plus de `carte-facile`, vous devez installer la bibliothèque de cartographie que vous souhaitez utiliser :
* Si vous ne savez pas quelle librairie choisir, nous vous conseillons d'utiliser maplibre-gl par défaut. *

```bash
# Pour MapLibre
npm install maplibre-gl

# Pour Leaflet
npm install leaflet

# Pour OpenLayers
npm install ol
```

## Utilisation

### Styles disponibles

La bibliothèque fournit différents styles de cartes :

- `standard` : Style standard
- `desaturated` : Style désaturé
- `aerial` : Photographie aérienne

### Fournisseurs de cartes

- `ign` : Institut Géographique National (par défaut)
- `osm` : OpenStreetMap (à venir)

### Exemples d'utilisation

#### Avec MapLibre

```typescript
import { getMap } from 'carte-facile';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  style: getMap('standard', 'ign').style,
});
```

#### Avec Leaflet

```typescript
import { getMap } from 'carte-facile';
import L from 'leaflet';

const map = L.map('map', {

});

```

#### Avec OpenLayers

```typescript
import { getMap } from 'carte-facile';
import Map from 'ol/Map';

const map = new Map({
  target: 'map'
});

```

## API

### Fonction `getMap`

```typescript
function getMap(type: MapType, provider?: MapProvider): MapConfig
```

#### Paramètres

- `type` : Le type de carte (`'standard' | 'desaturated' | 'aerial'`)
- `provider` : Le fournisseur de carte (`'ign' | 'osm'`, par défaut `'ign'`)

#### Retour

Un objet `MapConfig` contenant :
- `name` : Nom du style
- `style` : Configuration du style au format JSON
- `provider` : Fournisseur de la carte
- `metadata` : Métadonnées du style (nom, description, etc.)

## Types

```typescript
type MapType = 'desaturated' | 'standard' | 'aerial';
type MapProvider = 'ign' | 'osm';

interface MapConfig {
  name: string;
  style: unknown;
  provider: MapProvider;
  metadata: MapMetadata;
}
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.
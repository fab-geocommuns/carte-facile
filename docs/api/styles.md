# API des Styles

Cette documentation détaille l'API des styles disponible dans Carte Facile.

## Fonction principale

### getMap(style, provider)

La fonction principale pour obtenir un style de carte.

#### Paramètres

- `style` (string) : Le style de carte à utiliser
  - `'standard'` : Style par défaut
  - `'desaturated'` : Style désaturé
  - `'aerial'` : Vue aérienne
- `provider` (string) : Le fournisseur de données
  - `'ign'` : Institut Géographique National
  - `'osm'` : OpenStreetMap (à venir)

#### Retour

```typescript
interface MapStyle {
  style: object;  // Style MapLibre GL
  url: string;    // URL des tuiles pour Leaflet
  attribution: string; // Attribution légale
  minZoom: number;
  maxZoom: number;
}
```

#### Exemple

```typescript
import { getMap } from 'carte-facile';

// Pour MapLibre
const mapStyle = getMap('standard', 'ign');
const map = new maplibregl.Map({
  style: mapStyle.style,
  // ...
});

// Pour Leaflet
const tileUrl = getMap('standard', 'ign').url;
L.tileLayer(tileUrl, {
  attribution: mapStyle.attribution,
  minZoom: mapStyle.minZoom,
  maxZoom: mapStyle.maxZoom
}).addTo(map);
```

## Personnalisation

### customizeStyle(baseStyle, options)

Permet de personnaliser un style existant.

#### Paramètres

- `baseStyle` (MapStyle) : Style de base à personnaliser
- `options` (object) : Options de personnalisation
  ```typescript
  interface StyleOptions {
    colors?: {
      water?: string;
      land?: string;
      buildings?: string;
      roads?: string;
      // ...
    };
    labels?: {
      size?: number;
      color?: string;
      halo?: boolean;
      // ...
    };
    // ...
  }
  ```

#### Exemple

```typescript
import { getMap, customizeStyle } from 'carte-facile';

const baseStyle = getMap('standard', 'ign');
const customStyle = customizeStyle(baseStyle, {
  colors: {
    water: '#a0c8f0',
    land: '#f0e8d8'
  },
  labels: {
    size: 14,
    color: '#333333'
  }
});
```

## Constantes

### Styles disponibles

```typescript
export const AVAILABLE_STYLES = {
  STANDARD: 'standard',
  DESATURATED: 'desaturated',
  AERIAL: 'aerial'
} as const;
```

### Fournisseurs disponibles

```typescript
export const AVAILABLE_PROVIDERS = {
  IGN: 'ign',
  OSM: 'osm'  // à venir
} as const;
```

## Types

### MapStyle

```typescript
interface MapStyle {
  style: object;        // Style MapLibre GL
  url: string;          // URL des tuiles
  attribution: string;  // Attribution légale
  minZoom: number;     // Zoom minimum
  maxZoom: number;     // Zoom maximum
}
```

### StyleOptions

```typescript
interface StyleOptions {
  colors?: {
    water?: string;
    land?: string;
    buildings?: string;
    roads?: string;
    [key: string]: string;
  };
  labels?: {
    size?: number;
    color?: string;
    halo?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}
```

## Exemples avancés

### Création d'un style hybride

```typescript
const baseStyle = getMap('standard', 'ign');
const aerialStyle = getMap('aerial', 'ign');

const hybridStyle = customizeStyle(baseStyle, {
  // Utiliser l'imagerie aérienne comme fond
  background: aerialStyle.style.sources.aerial,
  // Garder les labels et routes du style standard
  layers: baseStyle.style.layers.filter(layer => 
    layer.type === 'symbol' || layer.type === 'line'
  )
});
```

### Style avec palette de couleurs personnalisée

```typescript
const customColorStyle = customizeStyle(baseStyle, {
  colors: {
    water: '#a0c8f0',
    land: '#f0e8d8',
    buildings: '#d0c0b0',
    roads: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      tertiary: '#e0e0e0'
    }
  },
  labels: {
    size: {
      base: 12,
      large: 14,
      small: 10
    },
    color: '#333333',
    halo: true,
    haloColor: '#ffffff',
    haloWidth: 1
  }
}); 
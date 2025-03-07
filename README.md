# Carte Facile

Une librairie de styles de cartes et composants clés en main, pour ajouter des cartes rapidement à votre application avec MapLibre.

## Installation

1. Installer la librairie (en beta)
```bash
npm install carte-facile@beta
```

2. Installer MapLibre GL JS
```bash
npm install maplibre-gl
```

## Utilisation

```typescript
import { getMapStyle } from 'carte-facile';

// Obtenir un style de carte
const style = getMapStyle('desaturated', 'ign');

// Utiliser le style avec MapLibre
const map = new maplibregl.Map({
  container: 'map',
  style: style.style,
  center: [2.3522, 48.8566], // Paris
  zoom: 12
});
```

## Styles disponibles

### IGN
- `desaturated` : Style désaturé pour la datavisualisation
- `standard` : Style standard
- `aerial` : Style photographique aérien

## Développement

```bash
# Installer les dépendances
npm install

# Compiler
npm run build

# Mode développement
npm run dev
```
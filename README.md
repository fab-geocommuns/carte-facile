# Carte Facile

[![npm version](https://img.shields.io/npm/v/carte-facile.svg)](https://www.npmjs.com/package/carte-facile)
[![License](https://img.shields.io/npm/l/carte-facile.svg)](https://github.com/votre-username/carte-facile/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/carte-facile.svg)](https://www.npmjs.com/package/carte-facile)
[![Tests](https://github.com/votre-username/carte-facile/workflows/Tests/badge.svg)](https://github.com/votre-username/carte-facile/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Une bibliothèque simple pour gérer les styles de cartes, compatible avec différentes bibliothèques de cartographie (MapLibre, Leaflet, OpenLayers).

## Table des matières

- [Carte Facile](#carte-facile)
  - [Table des matières](#table-des-matières)
  - [Installation](#installation)
  - [Prérequis](#prérequis)
  - [Utilisation](#utilisation)
    - [Styles disponibles](#styles-disponibles)
    - [Exemples d'utilisation](#exemples-dutilisation)
      - [Ajouter une carte avec MapLibre](#ajouter-une-carte-avec-maplibre)
  - [Contribution](#contribution)
  - [Développement](#développement)
    - [Mise en place de l'environnement de développement](#mise-en-place-de-lenvironnement-de-développement)
    - [Tests](#tests)
    - [Standards de code](#standards-de-code)

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

> **WARNING**: Actuellement les styles sont compatible avec Maplibre, peuvent poser des problématique pour les autres librairies.

## Utilisation

### Styles disponibles

La bibliothèque fournit différents styles de cartes :

- `standard` : Style standard
- `desaturated` : Style désaturé
- `aerialPhotography` : Photographie aérienne

Avec différents fournisseurs de données : 

- `ign` : Institut Géographique National (par défaut)
- `osm` : OpenStreetMap (à venir, pas encore disponible)

Pour récupérer une carte :

```typescript
mapStyle.ign.standard
```

### Exemples d'utilisation

Créer un conteneur html pour la carte:

```html
<!-- HTML nécessaire -->
<div id="map" style="height: 500px; width: 100%;"></div>
```

#### Ajouter une carte avec MapLibre

```typescript
import { mapStyle } from 'carte-facile';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  style: mapStyle.ign.standard,
});
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## Développement

### Mise en place de l'environnement de développement

1. Cloner le dépôt :
```bash
git clone https://github.com/fab-geocommuns/carte-facile.git
cd carte-facile
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer les tests :
```bash
npm run test
```

4. Compiler le projet :
```bash
npm run build
```

### Tests

Les tests sont écrits avec Jest. Pour ajouter de nouveaux tests :

1. Créer un fichier de test dans le dossier `tests`
2. Utiliser la convention de nommage `*.test.ts`
3. Lancer les tests avec `npm run test`


### Standards de code

- Utiliser TypeScript pour tout nouveau code
- Documenter les nouvelles fonctionnalités dans le README
- Ajouter des tests pour les nouvelles fonctionnalités


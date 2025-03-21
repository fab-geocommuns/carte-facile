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
    - [Fournisseurs de cartes](#fournisseurs-de-cartes)
    - [Exemples d'utilisation](#exemples-dutilisation)
      - [Avec MapLibre](#avec-maplibre)
      - [Avec Leaflet](#avec-leaflet)
      - [Avec OpenLayers](#avec-openlayers)
  - [Contribution](#contribution)
  - [Développement](#développement)
    - [Mise en place de l'environnement de développement](#mise-en-place-de-lenvironnement-de-développement)
    - [Structure du projet](#structure-du-projet)
    - [Scripts disponibles](#scripts-disponibles)
    - [Tests](#tests)
    - [Contribution au code](#contribution-au-code)
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

Créer un conteneur html pour la carte:

```html
<!-- HTML nécessaire -->
<div id="map" style="height: 500px; width: 100%;"></div>
```

#### Avec MapLibre

```typescript
import { mapStyle } from 'carte-facile';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  style: mapStyle.ign.standard,
});
```

#### Avec Leaflet

#### Avec OpenLayers

Exemples : https://openlayers.org/ol-mapbox-style/examples/ 


## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## Développement

### Mise en place de l'environnement de développement

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-username/carte-facile.git
cd carte-facile
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer les tests :
```bash
npm test
```

4. Compiler le projet :
```bash
npm run build
```

### Structure du projet

```
src/
├── map/              # Styles de cartes et configuration
│   ├── types.ts      # Types communs
│   ├── index.ts      # Point d'entrée principal
│   └── providers/    # Styles par fournisseur
│       └── ign/      # Styles IGN
├── components/       # Composants React (si applicable)
├── hooks/           # Hooks React (si applicable)
└── utils/           # Utilitaires
```

### Scripts disponibles

- `npm run build` : Compile le projet
- `npm run test` : Lance les tests
- `npm run lint` : Vérifie le code avec ESLint
- `npm run format` : Formate le code avec Prettier
- `npm run dev` : Lance le mode développement avec hot-reload

### Tests

Les tests sont écrits avec Jest. Pour ajouter de nouveaux tests :

1. Créer un fichier de test dans le dossier `__tests__`
2. Utiliser la convention de nommage `*.test.ts`
3. Lancer les tests avec `npm test`

### Contribution au code

1. Créer une branche pour votre fonctionnalité :
```bash
git checkout -b feature/nouvelle-fonctionnalite
```

2. Commiter vos changements :
```bash
git commit -m "feat: ajout d'une nouvelle fonctionnalité"
```

3. Pousser vers GitHub :
```bash
git push origin feature/nouvelle-fonctionnalite
```

4. Créer une Pull Request sur GitHub

### Standards de code

- Utiliser TypeScript pour tout nouveau code
- Suivre les conventions de commit [Conventional Commits](https://www.conventionalcommits.org/)
- Documenter les nouvelles fonctionnalités dans le README
- Ajouter des tests pour les nouvelles fonctionnalités


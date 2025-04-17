# Carte Facile

[![npm version](https://img.shields.io/npm/v/carte-facile.svg)](https://www.npmjs.com/package/carte-facile)
[![License](https://img.shields.io/npm/l/carte-facile.svg)](https://github.com/fab-geocommuns/carte-facile/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/carte-facile.svg)](https://www.npmjs.com/package/carte-facile)
[![Tests](https://github.com/fab-geocommuns/carte-facile/workflows/Tests/badge.svg)](https://github.com/fab-geocommuns/carte-facile/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Une bibliothèque simple pour gérer les styles de cartes, compatible avec différentes bibliothèques de cartographie (MapLibre, Leaflet, OpenLayers).

La documentation officielle est disponible sur le site dédié : [Documentation de Carte facile](https://fab-geocommuns.github.io/carte-facile-site/)

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
    - [Publication](#publication)
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

- `simple` : Style classique
- `desaturated` : Style désaturé
- `aerialPhotography` : Photographie aérienne

Pour récupérer une carte :

```typescript
mapStyle.simple
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
  style: mapStyle.simple,
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

> **Note**: Si vous modifiez le code source, n'oubliez pas de relancer `npm run build` pour mettre à jour le dossier `dist`. Vous pouvez aussi utiliser `npm run dev` pour un mode développement avec recompilation automatique.

### Tests

Les tests sont écrits avec Jest. Pour ajouter de nouveaux tests :

1. Créer un fichier de test dans le dossier `tests`
2. Utiliser la convention de nommage `*.test.ts`
3. Lancer les tests avec `npm run test`

### Publication

Pour publier une nouvelle version du package :

1. S'assurer que votre branche `dev` est à jour et que tous les changements sont commités :
```bash
git checkout dev
git status  # vérifier que tout est commité
```

2. Mettre à jour la version :
```bash
npm version patch  # pour un bugfix (0.0.X)
# ou
npm version minor  # pour une nouvelle fonctionnalité (0.X.0)
# ou
npm version major  # pour un changement majeur (X.0.0)
```

3. Fusionner les changements dans main :
```bash
git checkout main
git merge dev
git push origin main
git push origin --tags
```

> **Note**: Le workflow GitHub Actions va automatiquement :
> - Publier le package sur npm
> - Créer une release sur GitHub avec les notes de release générées automatiquement

### Standards de code

- Utiliser TypeScript pour tout nouveau code
- Documenter les nouvelles fonctionnalités dans le README
- Ajouter des tests pour les nouvelles fonctionnalités


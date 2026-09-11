# Carte Facile

[![npm version](https://img.shields.io/npm/v/carte-facile.svg)](https://www.npmjs.com/package/carte-facile)
[![License](https://img.shields.io/npm/l/carte-facile.svg)](https://github.com/fab-geocommuns/carte-facile/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/carte-facile.svg)](https://www.npmjs.com/package/carte-facile)
[![Tests](https://github.com/fab-geocommuns/carte-facile/workflows/Tests/badge.svg)](https://github.com/fab-geocommuns/carte-facile/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Une bibliothèque simple pour gérer les styles de cartes, surcouches et composants cartographiques.

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
    - [Ajouter une surcouche (overlay)](#ajouter-une-surcouche-overlay)
    - [Ajouter le sélecteur de carte et surcouches](#ajouter-le-sélecteur-de-carte-et-surcouches)
    - [Gérer la visibilité des couches](#gérer-la-visibilité-des-couches)
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

En plus de `carte-facile`, vous devez installer la bibliothèque de cartographie maplibre-gl.

```bash
# Pour MapLibre
npm install maplibre-gl
```

## Utilisation

### Styles disponibles

La bibliothèque fournit différents styles de cartes :

- `simple` : Style classique
- `desaturated` : Style désaturé
- `aerial` : Photographie aérienne

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
import { mapStyles } from 'carte-facile';
import maplibregl from 'maplibre-gl';
import 'carte-facile/carte-facile.css'; // Import du CSS pour les composants

const map = new maplibregl.Map({
  container: 'map',
  style: mapStyles.simple,
});
```

### Ajouter une surcouche (overlay)

Vous pouvez ajouter une ou plusieurs surcouches (par exemple le cadastre ou les limites administratives) à votre carte :

```typescript
import { addOverlay, Overlay } from 'carte-facile';

// Ajouter une seule surcouche
addOverlay(map, Overlay.administrativeBoundaries);

// Ou ajouter plusieurs surcouches en même temps
addOverlay(map, [Overlay.administrativeBoundaries, Overlay.cadastre]);
```
> Le style de la surcouche s'adapte automatiquement au fond de carte utilisé.

Pour retirer une ou plusieurs surcouches :

```typescript
import { removeOverlay } from 'carte-facile';

// Retirer une seule surcouche
removeOverlay(map, Overlay.administrativeBoundaries);

// Ou retirer plusieurs surcouches en même temps
removeOverlay(map, [Overlay.administrativeBoundaries, Overlay.cadastre]);
```

Pour obtenir la liste des surcouches disponibles :

```typescript
import { Overlay } from 'carte-facile';

// Liste des surcouches disponibles
console.log(Overlay);

```
Ou utilisez l'autocomplétion de votre IDE avec `Overlay.`.

### Ajouter le sélecteur de carte et surcouches

Ce composant vous permet d'avoir immédiatement accès aux cartes et surcouches disponibles à travers une interface pour votre carte.

Pour ajouter le sélecteur de carte par défaut :

```typescript
import { MapSelectorControl } from 'carte-facile';

map.addControl(new MapSelectorControl);
```

Pour préciser les cartes et surcouches que vous voulez afficher dans le composant, et préciser sa position : 

```typescript
import { MapSelectorControl } from 'carte-facile';

map.addControl(new MapSelectorControl({
  styles: ['simple', 'aerial'],
  overlays: ['administrativeBoundaries', 'cadastre']
}), 'bottom-left');
```


### Gérer la visibilité des couches

Vous pouvez afficher ou masquer des groupes de couches :

```typescript
import { showLayer, hideLayer, LayerGroup } from 'carte-facile';

// Afficher un seul groupe de couches
showLayer(map, LayerGroup.buildings);

// Ou afficher plusieurs groupes de couches
showLayer(map, [LayerGroup.buildings, LayerGroup.streets]);

// Masquer un seul groupe de couches
hideLayer(map, LayerGroup.streets);

// Ou masquer plusieurs groupes de couches
hideLayer(map, [LayerGroup.buildings, LayerGroup.streets]);
```

Pour obtenir la liste des groupes de couches disponibles :

```typescript
import { LayerGroup } from 'carte-facile';

// Liste des groupes de couches disponibles
console.log(LayerGroup);

```
Ou utilisez l'autocomplétion de votre IDE avec `LayerGroup.`.


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

La publication sur npm est entièrement automatisée par GitHub Actions ([.github/workflows/publish.yml](.github/workflows/publish.yml)) : dès qu'une Pull Request est mergée sur `main`, le workflow exécute les tests, compile le projet, publie le package sur npm et crée un tag ainsi qu'une release GitHub (`v<version>`) — à partir de la version présente dans `package.json` à ce moment-là.

La seule chose à faire manuellement est de mettre à jour cette version **avant** de merger :

1. Sur votre branche, mettez à jour la version dans `package.json` :
```bash
npm version patch  # pour un bugfix (0.0.X)
# ou
npm version minor  # pour une nouvelle fonctionnalité (0.X.0)
# ou
npm version major  # pour un changement majeur (X.0.0)
```

2. Poussez votre branche et ouvrez une [Pull Request](https://github.com/fab-geocommuns/carte-facile/pulls) vers `main`

3. Une fois les checks passés, mergez la PR : la publication se déclenche automatiquement.

### Standards de code

- Utiliser TypeScript pour tout nouveau code.
- Documenter les nouvelles fonctionnalités dans la documentation de la librairie : [Documentation de Carte facile](https://fab-geocommuns.github.io/carte-facile-site/).
- Ajouter des tests pour les nouvelles fonctionnalités.


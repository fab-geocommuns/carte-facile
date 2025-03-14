# Installation

## Prérequis

Avant d'installer Carte Facile, assurez-vous d'avoir :

- Node.js (version 14 ou supérieure)
- npm ou yarn

## Installation de base

```bash
npm install carte-facile
```

ou avec yarn :

```bash
yarn add carte-facile
```

## Installation des dépendances

En fonction de la bibliothèque de cartographie que vous souhaitez utiliser, installez les dépendances correspondantes :

### MapLibre (Recommandé)
```bash
npm install maplibre-gl
```

### Leaflet
```bash
npm install leaflet
```

### OpenLayers
```bash
npm install ol
```

## Vérification de l'installation

Pour vérifier que l'installation s'est bien déroulée, vous pouvez créer un fichier de test simple :

```typescript
import { getMap } from 'carte-facile';

// Si vous pouvez importer la bibliothèque sans erreur, l'installation est réussie
console.log(getMap('standard', 'ign'));
```

### Problèmes de compatibilité
Assurez-vous que les versions de vos bibliothèques de cartographie sont compatibles avec Carte Facile. 
⚠️ Actuellement, la librairie carte-facile fonctionne avec maplibre-gl, mais n'est pas éprouvé pour les autres librairies cartographiques.
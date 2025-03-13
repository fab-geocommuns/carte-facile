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

### Publication

1. Mettre à jour la version dans `package.json` :
```bash
npm version patch|minor|major
```

2. Construire le projet :
```bash
npm run build
```

3. Publier sur npm :
```bash
npm publish
```

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
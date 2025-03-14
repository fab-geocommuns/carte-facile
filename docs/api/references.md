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
interface MapConfig {
  name: string;          // Nom du style de carte
  provider: MapProvider; // Fournisseur de la carte (ign, osm)
  metadata: {
    fr: {
      name: string;        // Nom en français
      description: string; // Description en français
      use: string;        // Cas d'utilisation en français
      accessibility: string; // Informations d'accessibilité en français
    };
    en: {
      name: string;        // Nom en anglais
      description: string; // Description en anglais
      use: string;        // Cas d'utilisation en anglais
      accessibility: string; // Informations d'accessibilité en anglais
    };
    source: string;      // Source des données
    url: string;         // URL de la source
    version: string;     // Version du style
  };
  thumbnail: string;     // Chemin vers l'image de miniature de la carte
}
```

#### Exemple avec MapLibre

```typescript
import { getMap } from 'carte-facile';

const map = new maplibregl.Map({
  style: getMap('standard', 'ign'),
  // ...
});
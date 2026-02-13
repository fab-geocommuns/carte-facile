import type { Map, LngLatBoundsLike } from 'maplibre-gl';
import type { SearchProvider, SearchResult } from '../SearchControl';

const API_URL = 'https://data.geopf.fr/geocodage/search';

// Highlight layer IDs
const HIGHLIGHT_SOURCE_ID = 'admin-highlight-source';
const HIGHLIGHT_LAYER_ID = 'admin-highlight';
const HIGHLIGHT_OUTLINE_ID = 'admin-highlight-outline';

// Style
const HIGHLIGHT_COLOR = '#3b82f6';
const MASK_COLOR = '#000000';
const MASK_OPACITY = 0.1;
const OUTLINE_WIDTH = 3;
const FIT_PADDING = 160;

// Search limits
const ADDRESS_LIMIT = 5;
const ADMIN_LIMIT = 5;

interface AddressData {
    type: 'address';
}

interface AdminData {
    type: 'admin';
    truegeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

type ResultData = AddressData | AdminData;

/**
 * Unified search provider for the French Geoplateforme geocoding API.
 * Searches addresses and administrative divisions (communes, départements,
 * régions, EPCI) in parallel, with boundary highlighting for admin results.
 *
 * @see https://data.geopf.fr/geocodage/openapi
 */
export const GeopfGeocoder: SearchProvider = {
    name: 'geopf',
    placeholder: 'Rechercher...',

    async search(query: string): Promise<SearchResult[]> {
        const [addresses, admin] = await Promise.all([
            searchAddresses(query),
            searchAdmin(query)
        ]);

        return [...admin, ...addresses];
    },

    onClear(map: Map): void {
        removeHighlight(map);
    },

    async onSelect(result: SearchResult, map: Map): Promise<void> {
        const data = result.data as ResultData | undefined;
        if (!data) return;

        removeHighlight(map);

        if (data.type === 'address') {
            if (result.center) {
                map.jumpTo({ center: result.center, zoom: 17 });
            }
            return;
        }

        // Normalize to array of polygon rings (each polygon's outer + inner rings)
        const rings: number[][][] = data.truegeometry.type === 'Polygon'
            ? data.truegeometry.coordinates
            : data.truegeometry.coordinates.flat();

        // Compute bbox from all outer rings
        const allCoords = rings.flat() as [number, number][];
        const bbox = bboxFromCoordinates(allCoords);
        if (bbox) {
            map.fitBounds(bbox as LngLatBoundsLike, { padding: FIT_PADDING, animate: false });
        }

        // Inverted mask: world polygon with each ring as a hole
        const mask: GeoJSON.Polygon = {
            type: 'Polygon',
            coordinates: [
                [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
                ...rings
            ]
        };

        map.addSource(HIGHLIGHT_SOURCE_ID, {
            type: 'geojson',
            data: { type: 'Feature', geometry: mask, properties: {} }
        });

        map.addLayer({
            id: HIGHLIGHT_LAYER_ID,
            type: 'fill',
            source: HIGHLIGHT_SOURCE_ID,
            paint: { 'fill-color': MASK_COLOR, 'fill-opacity': MASK_OPACITY }
        });

        map.addLayer({
            id: HIGHLIGHT_OUTLINE_ID,
            type: 'line',
            source: HIGHLIGHT_SOURCE_ID,
            paint: { 'line-color': HIGHLIGHT_COLOR, 'line-width': OUTLINE_WIDTH }
        });
    }
};

/** Search addresses via the address index */
async function searchAddresses(query: string): Promise<SearchResult[]> {
    try {
        const params = new URLSearchParams({
            q: query,
            index: 'address',
            limit: String(ADDRESS_LIMIT)
        });

        const response = await fetch(`${API_URL}?${params}`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data.features)) return [];

        return data.features
            .filter((f: any) => f.properties.type !== 'municipality')
            .map((f: any) => {
                const { id, name, label: fullLabel } = f.properties;
                const suffix = name && fullLabel.startsWith(name)
                    ? fullLabel.slice(name.length).trim()
                    : undefined;
                return {
                    id,
                    label: name ?? fullLabel,
                    description: suffix || undefined,
                    center: f.geometry.coordinates as [number, number],
                    data: { type: 'address' } as AddressData
                };
            });
    } catch {
        return [];
    }
}

/** Search administrative divisions via the POI index */
async function searchAdmin(query: string): Promise<SearchResult[]> {
    try {
        const params = new URLSearchParams({
            q: query,
            index: 'poi',
            category: 'administratif',
            returntruegeometry: 'true',
            limit: String(ADMIN_LIMIT)
        });

        const response = await fetch(`${API_URL}?${params}`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data.features)) return [];

        return data.features
            .filter((f: any) => f.properties.truegeometry)
            .map((f: any) => {
                const truegeometry = typeof f.properties.truegeometry === 'string'
                    ? JSON.parse(f.properties.truegeometry)
                    : f.properties.truegeometry;
                return {
                    id: f.properties.toponym || f.properties.id,
                    label: f.properties.toponym,
                    description: buildAdminDescription(f.properties),
                    data: { type: 'admin', truegeometry } as AdminData
                };
            });
    } catch {
        return [];
    }
}

/** Build a description string from admin POI properties */
function buildAdminDescription(props: any): string | undefined {
    const categories: string[] = props.category || [];
    if (categories.includes('région')) return '(région)';
    if (categories.includes('département')) return '(département)';
    if (categories.includes('epci')) return '(intercommunalité)';
    if (categories.includes('arrondissement municipal')) return '(arrondissement)';
    const postcodes: string[] = props.postcode || [];
    return postcodes.length > 0 ? `(${postcodes[0]})` : undefined;
}

/** Remove existing highlight layers and sources */
function removeHighlight(map: Map): void {
    if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
    if (map.getLayer(HIGHLIGHT_OUTLINE_ID)) map.removeLayer(HIGHLIGHT_OUTLINE_ID);
    if (map.getSource(HIGHLIGHT_SOURCE_ID)) map.removeSource(HIGHLIGHT_SOURCE_ID);
}

/** Calculate bbox from array of coordinates */
function bboxFromCoordinates(coords: [number, number][]): [number, number, number, number] | null {
    if (coords.length === 0) return null;

    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }

    return [minLng, minLat, maxLng, maxLat];
}

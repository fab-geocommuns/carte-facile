import type { Map, LngLatBoundsLike } from 'maplibre-gl';
import type { SearchProvider, SearchResult } from '../SearchControl';

// API
const API_BASE = 'https://geo.api.gouv.fr';

// Layer IDs
const HIGHLIGHT_SOURCE_ID = 'admin-geocoder-source';
const HIGHLIGHT_LAYER_ID = 'admin-geocoder-highlight';
const HIGHLIGHT_OUTLINE_ID = 'admin-geocoder-highlight-outline';

// Style
const HIGHLIGHT_COLOR = '#3b82f6';
const MASK_COLOR = '#000000';
const MASK_OPACITY = 0.1;
const OUTLINE_WIDTH = 3;
const FIT_PADDING = 160;

// Search limits
const COMMUNE_LIMIT = 3;
const OTHER_LIMIT = 2;

type AdminType = 'commune' | 'departement' | 'region' | 'epci';

const ADMIN_ENDPOINTS: Record<AdminType, string> = {
    commune: 'communes',
    departement: 'departements',
    region: 'regions',
    epci: 'epcis'
};

interface AdminData {
    type: AdminType;
    code: string;
}

/** API response types */
interface CommuneResponse {
    nom: string;
    code: string;
    codesPostaux?: string[];
    departement?: { nom: string };
}

interface AdminResponse {
    nom: string;
    code: string;
}

/**
 * Search provider for French administrative divisions.
 * Searches communes, départements, régions and EPCI in parallel.
 *
 * @see https://geo.api.gouv.fr/decoupage-administratif
 */
export const AdminGeocoder: SearchProvider = {
    name: 'admin',
    placeholder: 'Rechercher...',

    async search(query: string): Promise<SearchResult[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            const [communes, departements, regions, epcis] = await Promise.all([
                searchType('commune', query, controller.signal),
                searchType('departement', query, controller.signal),
                searchType('region', query, controller.signal),
                searchType('epci', query, controller.signal)
            ]);

            return [...regions, ...departements, ...communes, ...epcis];
        } finally {
            clearTimeout(timeout);
        }
    },

    onClear(map: Map): void {
        removeHighlight(map);
    },

    async onSelect(result: SearchResult, map: Map): Promise<void> {
        const adminData = result.data as AdminData | undefined;
        if (!adminData) return;

        removeHighlight(map);

        const contour = await fetchContour(adminData.type, adminData.code);
        if (!contour) return;

        const bbox = bboxFromCoordinates(contour.coordinates[0] as [number, number][]);
        if (bbox) {
            map.fitBounds(bbox as LngLatBoundsLike, { padding: FIT_PADDING, animate: false });
        }

        // Create inverted mask (world polygon with contour as hole)
        const mask: GeoJSON.Polygon = {
            type: 'Polygon',
            coordinates: [
                [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
                ...contour.coordinates
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

/** Remove existing highlight layers and sources */
function removeHighlight(map: Map): void {
    if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
    if (map.getLayer(HIGHLIGHT_OUTLINE_ID)) map.removeLayer(HIGHLIGHT_OUTLINE_ID);
    if (map.getSource(HIGHLIGHT_SOURCE_ID)) map.removeSource(HIGHLIGHT_SOURCE_ID);
}

/** Search for admin entities by type */
async function searchType(type: AdminType, query: string, signal: AbortSignal): Promise<SearchResult[]> {
    const endpoint = ADMIN_ENDPOINTS[type];
    const limit = type === 'commune' ? COMMUNE_LIMIT : OTHER_LIMIT;

    const params = new URLSearchParams({
        nom: query,
        fields: type === 'commune' ? 'nom,code,codesPostaux,departement' : 'nom,code',
        limit: String(limit)
    });

    if (type === 'commune') {
        params.set('boost', 'population');
    }

    try {
        const response = await fetch(`${API_BASE}/${endpoint}?${params}`, { signal });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data)) return [];

        return data.map((item: CommuneResponse | AdminResponse) => ({
            id: `${type}-${item.code}`,
            label: item.nom,
            description: buildDescription(type, item),
            data: { type, code: item.code } as AdminData
        }));
    } catch {
        return [];
    }
}

/** Build description based on admin type */
function buildDescription(type: AdminType, item: CommuneResponse | AdminResponse): string | undefined {
    if (type === 'commune') {
        const commune = item as CommuneResponse;
        const parts = [commune.codesPostaux?.[0], commune.departement?.nom].filter(Boolean);
        return parts.length > 0 ? `(${parts.join(', ')})` : undefined;
    }
    if (type === 'departement') {
        return `(${item.code})`;
    }
    return undefined;
}

/** Fetch contour geometry from API */
async function fetchContour(type: AdminType, code: string): Promise<GeoJSON.Polygon | null> {
    const endpoint = ADMIN_ENDPOINTS[type];

    try {
        const response = await fetch(`${API_BASE}/${endpoint}/${code}?fields=contour`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return null;

        const data = await response.json();
        return data.contour || null;
    } catch {
        return null;
    }
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

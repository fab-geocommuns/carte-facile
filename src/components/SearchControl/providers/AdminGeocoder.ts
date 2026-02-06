import type { Map, LngLatBoundsLike } from 'maplibre-gl';
import type { SearchProvider, SearchResult } from '../SearchControl';

// API & Sources
const API_BASE = 'https://geo.api.gouv.fr';
const VECTOR_SOURCE_ID = 'decoupage-administratif';
const VECTOR_SOURCE_URL = 'https://openmaptiles.geo.data.gouv.fr/data/decoupage-administratif.json';

// Layer IDs
const HIGHLIGHT_SOURCE_ID = 'admin-geocoder-source';
const HIGHLIGHT_LAYER_ID = 'admin-geocoder-highlight';
const HIGHLIGHT_OUTLINE_ID = 'admin-geocoder-highlight-outline';

// Style
const HIGHLIGHT_COLOR = '#3b82f6';
const MASK_COLOR = '#000000';
const MASK_OPACITY = 0.1;
const FILL_OPACITY = 0.1;
const OUTLINE_WIDTH = 3;
const FIT_PADDING = 160;

// Search limits
const COMMUNE_LIMIT = 3;
const OTHER_LIMIT = 2;

type AdminType = 'commune' | 'departement' | 'region' | 'epci';

const ADMIN_CONFIG: Record<AdminType, { endpoint: string; sourceLayer: string }> = {
    commune: { endpoint: 'communes', sourceLayer: 'communes' },
    departement: { endpoint: 'departements', sourceLayer: 'departements' },
    region: { endpoint: 'regions', sourceLayer: 'regions' },
    epci: { endpoint: 'epcis', sourceLayer: 'epcis' }
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
    region?: { nom: string };
    centre?: { coordinates: [number, number] };
    contour?: GeoJSON.Polygon;
}

interface DepartementResponse {
    nom: string;
    code: string;
}

interface RegionResponse {
    nom: string;
    code: string;
}

interface EpciResponse {
    nom: string;
    code: string;
    contour?: GeoJSON.Polygon;
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

        if (adminData.type === 'commune' || adminData.type === 'epci') {
            await highlightWithContour(map, adminData);
        } else {
            await highlightWithVectorTiles(map, adminData);
        }
    }
};

/** Remove existing highlight layers and sources */
function removeHighlight(map: Map): void {
    if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
    if (map.getLayer(HIGHLIGHT_OUTLINE_ID)) map.removeLayer(HIGHLIGHT_OUTLINE_ID);
    if (map.getSource(HIGHLIGHT_SOURCE_ID)) map.removeSource(HIGHLIGHT_SOURCE_ID);
}

/** Layer options for highlight layers */
interface LayerOptions {
    source: string;
    sourceLayer?: string;
    filter?: ['==', ['get', string], string];
    fillColor: string;
    fillOpacity: number;
}

/** Add fill and outline layers to map */
function addHighlightLayers(map: Map, options: LayerOptions): void {
    const baseLayer = {
        source: options.source,
        ...(options.sourceLayer && { 'source-layer': options.sourceLayer }),
        ...(options.filter && { filter: options.filter })
    };

    map.addLayer({
        id: HIGHLIGHT_LAYER_ID,
        type: 'fill',
        ...baseLayer,
        paint: { 'fill-color': options.fillColor, 'fill-opacity': options.fillOpacity }
    });

    map.addLayer({
        id: HIGHLIGHT_OUTLINE_ID,
        type: 'line',
        ...baseLayer,
        paint: { 'line-color': HIGHLIGHT_COLOR, 'line-width': OUTLINE_WIDTH }
    });
}

/** Highlight communes/EPCI using contour from API (inverted mask) */
async function highlightWithContour(map: Map, adminData: AdminData): Promise<void> {
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

    addHighlightLayers(map, {
        source: HIGHLIGHT_SOURCE_ID,
        fillColor: MASK_COLOR,
        fillOpacity: MASK_OPACITY
    });
}

/** Highlight départements/régions using vector tiles */
async function highlightWithVectorTiles(map: Map, adminData: AdminData): Promise<void> {
    const config = ADMIN_CONFIG[adminData.type];

    const bbox = await fetchBbox(adminData.type, adminData.code);
    if (bbox) {
        map.fitBounds(bbox as LngLatBoundsLike, { padding: FIT_PADDING, animate: false });
    }

    if (!map.getSource(VECTOR_SOURCE_ID)) {
        map.addSource(VECTOR_SOURCE_ID, { type: 'vector', url: VECTOR_SOURCE_URL });
    }

    addHighlightLayers(map, {
        source: VECTOR_SOURCE_ID,
        sourceLayer: config.sourceLayer,
        filter: ['==', ['get', 'code'], adminData.code],
        fillColor: HIGHLIGHT_COLOR,
        fillOpacity: FILL_OPACITY
    });
}

/** Search for admin entities by type */
async function searchType(type: AdminType, query: string, signal: AbortSignal): Promise<SearchResult[]> {
    const config = ADMIN_CONFIG[type];
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
        const response = await fetch(`${API_BASE}/${config.endpoint}?${params}`, { signal });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data)) return [];

        return data.map((item: CommuneResponse | DepartementResponse | RegionResponse | EpciResponse) => ({
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
function buildDescription(type: AdminType, item: CommuneResponse | DepartementResponse | RegionResponse | EpciResponse): string | undefined {
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

/** Fetch bbox for départements and régions */
async function fetchBbox(type: AdminType, code: string): Promise<[number, number, number, number] | null> {
    try {
        if (type === 'departement') {
            return await fetchDepartementBbox(code);
        }
        return await fetchRegionBbox(code);
    } catch {
        return null;
    }
}

/** Fetch contour geometry from API */
async function fetchContour(type: AdminType, code: string): Promise<GeoJSON.Polygon | null> {
    const endpoint = ADMIN_CONFIG[type].endpoint;

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

/** Calculate bbox from communes centers in a département */
async function fetchDepartementBbox(code: string): Promise<[number, number, number, number] | null> {
    try {
        const response = await fetch(`${API_BASE}/departements/${code}/communes?fields=centre`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return null;

        const communes: CommuneResponse[] = await response.json();
        if (!Array.isArray(communes) || communes.length === 0) return null;

        const centers = communes
            .filter(c => c.centre?.coordinates)
            .map(c => c.centre!.coordinates);

        return bboxFromCoordinates(centers);
    } catch {
        return null;
    }
}

/** Calculate bbox from communes centers in a région */
async function fetchRegionBbox(code: string): Promise<[number, number, number, number] | null> {
    try {
        const response = await fetch(`${API_BASE}/regions/${code}/departements?fields=code`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return null;

        const departements: DepartementResponse[] = await response.json();
        if (!Array.isArray(departements) || departements.length === 0) return null;

        const allCenters: [number, number][] = [];

        await Promise.all(
            departements.map(async dept => {
                try {
                    const communesResponse = await fetch(
                        `${API_BASE}/departements/${dept.code}/communes?fields=centre&limit=50`,
                        { signal: AbortSignal.timeout(5000) }
                    );
                    if (!communesResponse.ok) return;

                    const communes: CommuneResponse[] = await communesResponse.json();
                    communes
                        .filter(c => c.centre?.coordinates)
                        .forEach(c => allCenters.push(c.centre!.coordinates));
                } catch {
                    // Ignore individual failures
                }
            })
        );

        return allCenters.length > 0 ? bboxFromCoordinates(allCenters) : null;
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

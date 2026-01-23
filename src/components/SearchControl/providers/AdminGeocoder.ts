import type { Map, LngLatBoundsLike } from 'maplibre-gl';
import type { SearchProvider, SearchResult } from '../SearchControl';

const API_BASE = 'https://geo.api.gouv.fr';
const VECTOR_SOURCE_ID = 'decoupage-administratif';
const VECTOR_SOURCE_URL = 'https://openmaptiles.geo.data.gouv.fr/data/decoupage-administratif.json';
const HIGHLIGHT_SOURCE_ID = 'admin-geocoder-source';
const HIGHLIGHT_LAYER_ID = 'admin-geocoder-highlight';
const HIGHLIGHT_OUTLINE_ID = 'admin-geocoder-highlight-outline';

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

/**
 * Search provider for French administrative divisions.
 * Searches communes, départements, régions and EPCI in parallel.
 * Uses vector tiles for highlight display.
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

            return [...communes, ...departements, ...regions, ...epcis];
        } finally {
            clearTimeout(timeout);
        }
    },

    async onSelect(result: SearchResult, map: Map): Promise<void> {
        const adminData = result.data as AdminData | undefined;
        if (!adminData) return;

        const config = ADMIN_CONFIG[adminData.type];

        // Remove previous highlight
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
        if (map.getLayer(HIGHLIGHT_OUTLINE_ID)) map.removeLayer(HIGHLIGHT_OUTLINE_ID);
        if (map.getSource(HIGHLIGHT_SOURCE_ID)) map.removeSource(HIGHLIGHT_SOURCE_ID);

        if (adminData.type === 'commune' || adminData.type === 'epci') {
            // Use contour from API for communes and EPCI
            const contour = await fetchContour(adminData.type, adminData.code);
            if (contour) {
                const bbox = bboxFromCoordinates(contour.coordinates[0] as [number, number][]);
                if (bbox) {
                    map.fitBounds(bbox as LngLatBoundsLike, { padding: 50, animate: false });
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
                    paint: {
                        'fill-color': '#000000',
                        'fill-opacity': 0.3
                    }
                });

                map.addLayer({
                    id: HIGHLIGHT_OUTLINE_ID,
                    type: 'line',
                    source: HIGHLIGHT_SOURCE_ID,
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': 3
                    }
                });
            }
        } else {
            // Use vector tiles for départements and régions
            const bbox = await fetchBbox(adminData.type, adminData.code);
            if (bbox) {
                map.fitBounds(bbox as LngLatBoundsLike, { padding: 50, animate: false });
            }

            if (!map.getSource(VECTOR_SOURCE_ID)) {
                map.addSource(VECTOR_SOURCE_ID, {
                    type: 'vector',
                    url: VECTOR_SOURCE_URL
                });
            }

            map.addLayer({
                id: HIGHLIGHT_LAYER_ID,
                type: 'fill',
                source: VECTOR_SOURCE_ID,
                'source-layer': config.sourceLayer,
                filter: ['==', ['get', 'code'], adminData.code],
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.2
                }
            });

            map.addLayer({
                id: HIGHLIGHT_OUTLINE_ID,
                type: 'line',
                source: VECTOR_SOURCE_ID,
                'source-layer': config.sourceLayer,
                filter: ['==', ['get', 'code'], adminData.code],
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 3
                }
            });
        }
    }
};

/** Generic search function for all admin types */
async function searchType(type: AdminType, query: string, signal: AbortSignal): Promise<SearchResult[]> {
    const config = ADMIN_CONFIG[type];
    const limit = type === 'commune' ? '3' : '2';

    const params = new URLSearchParams({
        nom: query,
        fields: type === 'commune' ? 'nom,code,departement,region' : 'nom,code',
        limit
    });

    if (type === 'commune') {
        params.set('boost', 'population');
    }

    try {
        const response = await fetch(`${API_BASE}/${config.endpoint}?${params}`, { signal });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data)) return [];

        return data.map((item: any) => {
            let description: string;
            if (type === 'commune') {
                const parts = [item.departement?.nom, item.region?.nom].filter(Boolean);
                description = parts.length > 0 ? `Commune · ${parts.join(', ')}` : 'Commune';
            } else if (type === 'departement') {
                description = `Département (${item.code})`;
            } else if (type === 'region') {
                description = 'Région';
            } else {
                description = 'EPCI';
            }

            return {
                id: `${type}-${item.code}`,
                label: item.nom,
                description,
                data: { type, code: item.code } as AdminData
            };
        });
    } catch {
        return [];
    }
}

/** Fetch bbox for départements and régions */
async function fetchBbox(type: AdminType, code: string): Promise<[number, number, number, number] | null> {
    try {
        if (type === 'departement') {
            return await fetchDepartementBbox(code);
        } else {
            return await fetchRegionBbox(code);
        }
    } catch {
        return null;
    }
}

/** Fetch contour geometry from API (for communes and EPCI) */
async function fetchContour(type: AdminType, code: string): Promise<GeoJSON.Polygon | null> {
    const endpoint = ADMIN_CONFIG[type].endpoint;
    const response = await fetch(`${API_BASE}/${endpoint}/${code}?fields=contour`, {
        signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.contour || null;
}

/** Calculate bbox from communes centers in a département */
async function fetchDepartementBbox(code: string): Promise<[number, number, number, number] | null> {
    const response = await fetch(`${API_BASE}/departements/${code}/communes?fields=centre`, {
        signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const communes = await response.json();
    if (!Array.isArray(communes) || communes.length === 0) return null;

    const centers = communes
        .filter((c: any) => c.centre?.coordinates)
        .map((c: any) => c.centre.coordinates as [number, number]);

    return bboxFromCoordinates(centers);
}

/** Calculate bbox from communes centers in a région */
async function fetchRegionBbox(code: string): Promise<[number, number, number, number] | null> {
    const response = await fetch(`${API_BASE}/regions/${code}/departements?fields=code`, {
        signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const departements = await response.json();
    if (!Array.isArray(departements) || departements.length === 0) return null;

    // Fetch communes centers for all départements
    const allCenters: [number, number][] = [];
    await Promise.all(
        departements.map(async (dept: any) => {
            const communesResponse = await fetch(
                `${API_BASE}/departements/${dept.code}/communes?fields=centre&limit=50`,
                { signal: AbortSignal.timeout(5000) }
            );
            if (communesResponse.ok) {
                const communes = await communesResponse.json();
                communes
                    .filter((c: any) => c.centre?.coordinates)
                    .forEach((c: any) => allCenters.push(c.centre.coordinates));
            }
        })
    );

    return allCenters.length > 0 ? bboxFromCoordinates(allCenters) : null;
}

/** Calculate bbox from array of coordinates */
function bboxFromCoordinates(coords: [number, number][]): [number, number, number, number] | null {
    if (coords.length === 0) return null;

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    return [
        Math.min(...lngs),
        Math.min(...lats),
        Math.max(...lngs),
        Math.max(...lats)
    ];
}


import maplibregl from 'maplibre-gl';
import type { Map, LngLatBoundsLike } from 'maplibre-gl';
import type { SearchProvider, SearchResult } from '../SearchControl';

const API_URL = 'https://data.geopf.fr/geocodage/search';

const HIGHLIGHT_SOURCE_ID = 'admin-highlight-source';
const HIGHLIGHT_LAYER_ID = 'admin-highlight';
const HIGHLIGHT_OUTLINE_ID = 'admin-highlight-outline';

const HIGHLIGHT_COLOR = '#3b82f6';
const MASK_COLOR = '#000000';
const MASK_OPACITY = 0.075;
const FILL_OPACITY = 0.1;
const OUTLINE_WIDTH = 2;
const FIT_PADDING_RATIO = 0.15;

const ADDRESS_LIMIT = 5;
const POI_LIMIT = 5;

// A truegeometry with fewer vertices than this is just a bounding box, not a real contour
const MIN_CONTOUR_VERTICES = 8;

let currentMarker: maplibregl.Marker | null = null;

/** Raw feature shape returned by the Geoplateforme POI index */
interface GeopfPoiProperties {
    toponym: string;
    id: string;
    category?: string[];
    citycode?: string[];
    postcode?: string[];
    city?: string[];
    truegeometry?: string | GeoJSON.Polygon | GeoJSON.MultiPolygon;
}
interface GeopfPoiFeature {
    geometry: { coordinates: [number, number] };
    properties: GeopfPoiProperties;
}

/** Raw feature shape returned by the Geoplateforme address index */
interface GeopfAddressProperties {
    id: string;
    name?: string;
    label: string;
    citycode?: string;
    postcode?: string;
    city?: string;
    type?: string;
}
interface GeopfAddressFeature {
    geometry: { coordinates: [number, number] };
    properties: GeopfAddressProperties;
}

/**
 * Data exposed by GeopfGeocoder results.
 * Cast `result.data` to this type in your `onSelect` callback to access
 * the full API response and typed fields like the INSEE code.
 *
 * @example
 * import type { GeopfResultData } from 'carte-facile';
 *
 * new SearchControl({
 *   providers: [GeopfGeocoder],
 *   onSelect: (result) => {
 *     const data = result.data as GeopfResultData;
 *     // For address results: reliable 5-digit INSEE commune code (e.g. "75056")
 *     console.log(data.citycode);
 *     // For POI results: first entry from the array (e.g. "75" for Paris département)
 *     console.log(data.postcode);
 *     // Full raw properties from the API
 *     console.log(data.properties);
 *   }
 * });
 */
export interface GeopfResultData {
    /** Full raw feature properties from the API response */
    properties: Record<string, unknown>;
    /**
     * INSEE municipality code.
     * Reliable for address results (5-digit string, e.g. "75056").
     * For POI/admin results, first value from the `citycode` array — may be
     * a department code rather than the full commune code.
     */
    citycode?: string;
    /** First postal code */
    postcode?: string;
    /** City name (populated for POI results) */
    cityName?: string;
    /** Raw API categories (e.g. ["administratif", "commune"]) */
    category?: string[];
    /** Geometry polygon for contour display (when available) */
    geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    /** If true, geometry is rendered as inverted mask (admin boundaries) */
    invertedMask?: boolean;
}

/**
 * Unified search provider using the French Geoplateforme geocoding API.
 * Searches addresses and POI (administrative divisions, transport, monuments, etc.) in parallel.
 *
 * @see https://data.geopf.fr/geocodage/openapi
 */
export const GeopfGeocoder: SearchProvider = {
    name: 'geopf',
    placeholder: 'Rechercher...',

    async search(query: string): Promise<SearchResult[]> {
        const [admin, poi, addresses] = await Promise.all([
            searchAdminPoi(query),
            searchOtherPoi(query),
            searchAddresses(query)
        ]);
        return [...admin, ...poi, ...addresses];
    },

    onClear(map: Map): void {
        removeHighlight(map);
    },

    async onSelect(result: SearchResult, map: Map): Promise<void> {
        removeHighlight(map);

        const { geometry, invertedMask = false } = (result.data as GeopfResultData) ?? {};

        // Center the map on the bounding box of the contour when available.
        // Padding is computed as a fraction of the smaller viewport dimension.
        // fitBounds is wrapped in try/catch because it throws when padding >= viewport/2.
        if (geometry) {
            const bbox = computeBbox(geometry);
            let fitted = false;
            if (bbox) {
                try {
                    const container = map.getContainer();
                    const padding = Math.floor(
                        Math.min(container.offsetWidth, container.offsetHeight) * FIT_PADDING_RATIO
                    );
                    map.fitBounds(bbox as LngLatBoundsLike, {
                        padding,
                        animate: false,
                        // omit maxZoom for admin (no upper limit), cap at 18 for POI
                        ...(invertedMask ? {} : { maxZoom: 18 })
                    });
                    fitted = true;
                } catch {
                    // fallthrough to jumpTo below
                }
            }
            if (!fitted && result.center) {
                map.jumpTo({ center: result.center, zoom: 15 });
            }
        } else if (result.center) {
            map.jumpTo({ center: result.center, zoom: 17 });
        }

        // Display contour — isolated so that a rendering failure never prevents map movement
        if (geometry) {
            try {
                showContour(map, geometry, invertedMask);
            } catch (e) {
                console.warn('GeopfGeocoder: showContour failed', e);
            }
        }

        // Display pin marker — not shown for admin boundaries (contour is sufficient)
        if (result.center && !invertedMask) {
            currentMarker = new maplibregl.Marker({ color: HIGHLIGHT_COLOR })
                .setLngLat(result.center)
                .addTo(map);
        }
    }
};

/** Search administrative boundaries (communes, régions, etc.) */
async function searchAdminPoi(query: string): Promise<SearchResult[]> {
    try {
        const params = new URLSearchParams({
            q: query,
            index: 'poi',
            category: 'administratif',
            returntruegeometry: 'true',
            limit: String(POI_LIMIT)
        });
        const response = await fetch(`${API_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data.features)) return [];

        return (data.features as GeopfPoiFeature[]).map(f => {
            const geometry = f.properties.truegeometry ? parseGeometry(f.properties.truegeometry) : undefined;
            return mapPoiFeature(f, geometry, true);
        });
    } catch {
        return [];
    }
}

/** Search all other POI (transport, monuments, etc.) excluding admin and habitat duplicates */
async function searchOtherPoi(query: string): Promise<SearchResult[]> {
    try {
        const params = new URLSearchParams({
            q: query,
            index: 'poi',
            returntruegeometry: 'true',
            limit: String(POI_LIMIT)
        });
        const response = await fetch(`${API_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data.features)) return [];

        return (data.features as GeopfPoiFeature[])
            .filter(f => {
                const cats = f.properties.category ?? [];
                // Exclude admin (handled by searchAdminPoi) and habitat types
                // that merely duplicate commune results (e.g. "lieu-dit habité")
                return !cats.includes('administratif') && !cats.includes('lieu-dit habité');
            })
            .map(f => {
                const rawGeometry = f.properties.truegeometry ? parseGeometry(f.properties.truegeometry) : undefined;
                const geometry = rawGeometry && countVertices(rawGeometry) >= MIN_CONTOUR_VERTICES ? rawGeometry : undefined;
                return mapPoiFeature(f, geometry);
            });
    } catch {
        return [];
    }
}

async function searchAddresses(query: string): Promise<SearchResult[]> {
    try {
        const params = new URLSearchParams({ q: query, index: 'address', limit: String(ADDRESS_LIMIT) });
        const response = await fetch(`${API_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data.features)) return [];

        return (data.features as GeopfAddressFeature[])
            .filter(f => f.properties.type !== 'municipality')
            .map(f => {
                const { id, name, label: fullLabel, citycode, postcode, city, type: addrType } = f.properties;
                const suffix = name && fullLabel.startsWith(name) ? fullLabel.slice(name.length).trim() : undefined;
                return {
                    id,
                    label: name ?? fullLabel,
                    description: suffix || undefined,
                    type: 'address',
                    center: f.geometry.coordinates,
                    data: {
                        properties: f.properties as unknown as Record<string, unknown>,
                        citycode,
                        postcode,
                        cityName: city,
                        category: addrType ? [addrType] : []
                    } satisfies GeopfResultData
                };
            });
    } catch {
        return [];
    }
}

/** Maps a raw POI feature to a SearchResult. Shared by searchAdminPoi and searchOtherPoi. */
function mapPoiFeature(
    f: GeopfPoiFeature,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined,
    invertedMask = false
): SearchResult {
    const props = f.properties;
    const cats: string[] = props.category ?? [];
    return {
        id: props.toponym ?? props.id,
        label: props.toponym,
        description: buildPoiDescription(props),
        type: resolveType(cats),
        center: f.geometry.coordinates,
        data: {
            properties: props as unknown as Record<string, unknown>,
            citycode: props.citycode?.[0],
            postcode: props.postcode?.[0],
            cityName: props.city?.[0],
            category: cats,
            geometry,
            invertedMask
        } satisfies GeopfResultData
    };
}

function buildPoiDescription(props: GeopfPoiProperties): string | undefined {
    const categories: string[] = props.category ?? [];

    if (categories.includes('région')) return 'région';
    if (categories.includes('département')) return 'département';
    if (categories.includes('epci')) return 'intercommunalité';
    if (categories.includes('arrondissement municipal')) return 'arrondissement';
    if (categories.includes('commune')) {
        const postcodes: string[] = props.postcode ?? [];
        return postcodes.length > 0 ? `commune · ${postcodes[0]}` : 'commune';
    }

    if (categories.length > 0) {
        const typeLabel = CATEGORY_LABELS[categories[0]] ?? categories[0];
        const cities: string[] = props.city ?? [];
        return cities.length > 0 ? `${typeLabel} · ${cities[0]}` : typeLabel;
    }

    return undefined;
}

function resolveType(categories: string[]): string {
    if (categories.includes('région')) return 'region';
    if (categories.includes('département')) return 'department';
    if (categories.includes('epci')) return 'community';
    if (categories.includes('commune') || categories.includes('arrondissement municipal')) return 'city';
    if (categories.some(c => c.includes('gare'))) return 'train';
    if (categories.includes('administratif')) return 'admin';
    return 'poi';
}

const CATEGORY_LABELS: Record<string, string> = {
    'gare voyageurs et fret': 'gare',
    'lieu-dit habité': 'lieu-dit',
};

function parseGeometry(raw: unknown): GeoJSON.Polygon | GeoJSON.MultiPolygon {
    return typeof raw === 'string' ? JSON.parse(raw) : raw as GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

function countVertices(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): number {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
    return rings.reduce((sum, ring) => sum + ring.length, 0);
}

function computeBbox(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): [number, number, number, number] | null {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
    const coords = rings.flat() as [number, number][];
    if (coords.length === 0) return null;

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }
    return [minLng, minLat, maxLng, maxLat];
}

function showContour(map: Map, geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon, invertedMask: boolean): void {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();

    const geojson: GeoJSON.Polygon = invertedMask
        ? { type: 'Polygon', coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]], ...rings] }
        : { type: 'Polygon', coordinates: rings };

    map.addSource(HIGHLIGHT_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: geojson, properties: {} }
    });
    map.addLayer({
        id: HIGHLIGHT_LAYER_ID,
        type: 'fill',
        source: HIGHLIGHT_SOURCE_ID,
        paint: { 'fill-color': invertedMask ? MASK_COLOR : HIGHLIGHT_COLOR, 'fill-opacity': invertedMask ? MASK_OPACITY : FILL_OPACITY }
    });
    map.addLayer({
        id: HIGHLIGHT_OUTLINE_ID,
        type: 'line',
        source: HIGHLIGHT_SOURCE_ID,
        paint: { 'line-color': HIGHLIGHT_COLOR, 'line-width': OUTLINE_WIDTH }
    });
}

function removeHighlight(map: Map): void {
    currentMarker?.remove();
    currentMarker = null;
    if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
    if (map.getLayer(HIGHLIGHT_OUTLINE_ID)) map.removeLayer(HIGHLIGHT_OUTLINE_ID);
    if (map.getSource(HIGHLIGHT_SOURCE_ID)) map.removeSource(HIGHLIGHT_SOURCE_ID);
}

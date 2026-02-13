import maplibregl from 'maplibre-gl';
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
const FILL_OPACITY = 0.1;
const OUTLINE_WIDTH = 3;
const FIT_PADDING = 160;

// Search limits
const ADDRESS_LIMIT = 5;
const POI_LIMIT = 5;

// Minimum vertices for a truegeometry to be considered a real contour (not just a bbox)
const MIN_CONTOUR_VERTICES = 8;

// Module-level marker reference for cleanup
let currentMarker: maplibregl.Marker | null = null;

interface AddressData {
    type: 'address';
}

interface PoiData {
    type: 'poi';
    truegeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

interface AdminData {
    type: 'admin';
    truegeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

type ResultData = AddressData | PoiData | AdminData;

/**
 * Unified search provider for the French Geoplateforme geocoding API.
 * Searches addresses and POI (administrative divisions, transport, monuments, etc.)
 * in parallel, with boundary highlighting for administrative results and building POI.
 *
 * @see https://data.geopf.fr/geocodage/openapi
 */
export const GeopfGeocoder: SearchProvider = {
    name: 'geopf',
    placeholder: 'Rechercher...',

    async search(query: string): Promise<SearchResult[]> {
        const [addresses, pois] = await Promise.all([
            searchAddresses(query),
            searchPoi(query)
        ]);

        return [...pois, ...addresses];
    },

    onClear(map: Map): void {
        removeHighlight(map);
    },

    async onSelect(result: SearchResult, map: Map): Promise<void> {
        const data = result.data as ResultData | undefined;
        if (!data) return;

        removeHighlight(map);

        // Admin: inverted mask + fitBounds
        if (data.type === 'admin') {
            showContour(map, data.truegeometry, true);
            return;
        }

        // POI or address: pin marker + center map
        if (result.center) {
            if (data.type === 'poi' && data.truegeometry) {
                showContour(map, data.truegeometry, false);
            } else {
                map.jumpTo({ center: result.center, zoom: 17 });
            }
            currentMarker = new maplibregl.Marker({ color: HIGHLIGHT_COLOR })
                .setLngLat(result.center)
                .addTo(map);
        }
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

/** Search all POI (administrative, transport, monuments, etc.) */
async function searchPoi(query: string): Promise<SearchResult[]> {
    try {
        const params = new URLSearchParams({
            q: query,
            index: 'poi',
            returntruegeometry: 'true',
            limit: String(POI_LIMIT)
        });

        const response = await fetch(`${API_URL}?${params}`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data.features)) return [];

        return data.features.map((f: any) => {
            const categories: string[] = f.properties.category || [];
            const isAdmin = categories.includes('administratif') && f.properties.truegeometry;

            if (isAdmin) {
                const truegeometry = parseGeometry(f.properties.truegeometry);
                return {
                    id: f.properties.toponym || f.properties.id,
                    label: f.properties.toponym,
                    description: buildPoiDescription(f.properties),
                    data: { type: 'admin', truegeometry } as AdminData
                };
            }

            const truegeometry = f.properties.truegeometry
                ? parseGeometry(f.properties.truegeometry)
                : undefined;
            const hasRealContour = truegeometry ? countVertices(truegeometry) >= MIN_CONTOUR_VERTICES : false;

            return {
                id: f.properties.toponym || f.properties.id,
                label: f.properties.toponym,
                description: buildPoiDescription(f.properties),
                center: f.geometry.coordinates as [number, number],
                data: { type: 'poi', truegeometry: hasRealContour ? truegeometry : undefined } as PoiData
            };
        });
    } catch {
        return [];
    }
}

/** Build a description string from POI properties */
function buildPoiDescription(props: any): string | undefined {
    const categories: string[] = props.category || [];

    // Administrative types
    if (categories.includes('région')) return '(région)';
    if (categories.includes('département')) return '(département)';
    if (categories.includes('epci')) return '(intercommunalité)';
    if (categories.includes('arrondissement municipal')) return '(arrondissement)';
    if (categories.includes('commune')) {
        const postcodes: string[] = props.postcode || [];
        return postcodes.length > 0 ? `(${postcodes[0]})` : undefined;
    }

    // Other POI: city name
    const cities: string[] = props.city || [];
    return cities.length > 0 ? `(${cities[0]})` : undefined;
}

/** Parse truegeometry from API response (may be a JSON string) */
function parseGeometry(raw: any): GeoJSON.Polygon | GeoJSON.MultiPolygon {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/** Count total vertices in a geometry */
function countVertices(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): number {
    const rings = geometry.type === 'Polygon'
        ? geometry.coordinates
        : geometry.coordinates.flat();
    return rings.reduce((sum, ring) => sum + ring.length, 0);
}

/** Display a contour on the map, optionally as an inverted mask */
function showContour(map: Map, geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon, invertedMask: boolean): void {
    const rings: number[][][] = geometry.type === 'Polygon'
        ? geometry.coordinates
        : geometry.coordinates.flat();

    const allCoords = rings.flat() as [number, number][];
    const bbox = bboxFromCoordinates(allCoords);
    if (bbox) {
        map.fitBounds(bbox as LngLatBoundsLike, {
            padding: FIT_PADDING,
            animate: false,
            maxZoom: invertedMask ? undefined : 18
        });
    }

    const geojson: GeoJSON.Polygon = invertedMask
        ? {
            type: 'Polygon',
            coordinates: [
                [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
                ...rings
            ]
        }
        : { type: 'Polygon', coordinates: rings };

    map.addSource(HIGHLIGHT_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: geojson, properties: {} }
    });

    map.addLayer({
        id: HIGHLIGHT_LAYER_ID,
        type: 'fill',
        source: HIGHLIGHT_SOURCE_ID,
        paint: {
            'fill-color': invertedMask ? MASK_COLOR : HIGHLIGHT_COLOR,
            'fill-opacity': invertedMask ? MASK_OPACITY : FILL_OPACITY
        }
    });

    map.addLayer({
        id: HIGHLIGHT_OUTLINE_ID,
        type: 'line',
        source: HIGHLIGHT_SOURCE_ID,
        paint: { 'line-color': HIGHLIGHT_COLOR, 'line-width': OUTLINE_WIDTH }
    });
}

/** Remove existing highlight layers, sources and markers */
function removeHighlight(map: Map): void {
    if (currentMarker) {
        currentMarker.remove();
        currentMarker = null;
    }
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

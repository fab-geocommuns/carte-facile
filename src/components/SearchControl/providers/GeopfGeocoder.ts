import type { Map } from 'maplibre-gl';
import type { SearchProvider, SearchResult } from '../SearchControl';

const API_URL = 'https://data.geopf.fr/geocodage/search';

/**
 * Search provider for the French Geoplateforme geocoding API.
 * Returns addresses, places, and localities across France.
 *
 * @see https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
 */
export const GeopfGeocoder: SearchProvider = {
    name: 'geopf',
    placeholder: 'Rechercher une adresse...',

    /**
     * Searches for addresses matching the query.
     *
     * API response format (GeoJSON):
     * - features[].properties.label: Full address (e.g., "12 Rue de Rivoli 75001 Paris")
     * - features[].properties.context: Administrative context (e.g., "75, Paris, Île-de-France")
     * - features[].geometry.coordinates: [longitude, latitude]
     */
    async search(query: string): Promise<SearchResult[]> {
        const url = `${API_URL}?q=${encodeURIComponent(query)}&limit=5`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000) // 5s timeout to avoid hanging requests
        });

        if (!response.ok) {
            throw new Error(`Geoplateform API error: ${response.status}`);
        }

        const data = await response.json();

        // Guard against malformed API responses
        if (!Array.isArray(data.features)) {
            return [];
        }

        return data.features
            .filter((feature: any) => feature.properties.type !== 'municipality')
            .map((feature: any) => {
                const { id, name, label: fullLabel } = feature.properties;
                const suffix = name && fullLabel.startsWith(name)
                    ? fullLabel.slice(name.length).trim()
                    : undefined;
                return {
                    id,
                    label: name ?? fullLabel,
                    description: suffix || undefined,
                    center: feature.geometry.coordinates as [number, number]
                };
            });
    },
    
    //Centers the map on the selected result.
    onSelect(result: SearchResult, map: Map): void {
        if (result.center) {
            map.jumpTo({ center: result.center, zoom: 17 });
        }
    }
};

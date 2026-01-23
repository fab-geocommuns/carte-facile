import type { Map, IControl, ControlPosition } from 'maplibre-gl';
import './SearchControl.css';

/**
 * Search result returned by a provider
 */
export interface SearchResult {
    id: string;
    label: string;
    description?: string;
    /** Coordinates [longitude, latitude] */
    center?: [number, number];
    /** Bounding box [west, south, east, north] */
    bbox?: [number, number, number, number];
}

/**
 * Interface to implement a custom search provider
 */
export interface SearchProvider {
    name: string;
    placeholder?: string;
    search(query: string): Promise<SearchResult[]>;
    /** Action executed when a result is selected (move map, add marker, etc.) */
    onSelect(result: SearchResult, map: Map): void;
}

/**
 * SearchControl configuration options
 */
export interface SearchControlOptions {
    providers: SearchProvider | SearchProvider[];
    placeholder?: string;
    /** Delay before triggering search (default: 300ms) */
    debounceMs?: number;
    /** Minimum characters required (default: 3) */
    minChars?: number;
    /** Maximum results displayed (default: 5) */
    maxResults?: number;
}

const TEMPLATE = `
<div class="cartefacile-ctrl-search fr-search-bar" role="search">
    <label class="fr-label" for="cartefacile-search-input">Rechercher</label>
    <input
        class="fr-input"
        placeholder="Rechercher"
        id="cartefacile-search-input"
        type="search"
        autocomplete="off"
    >
    <button title="Rechercher" type="button" class="fr-btn">Rechercher</button>
</div>
`;

/**
 * Search control for MapLibre GL
 *
 * @example
 * map.addControl(new SearchControl({
 *     providers: GeopfProvider
 * }));
 */
export class SearchControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;
    private _input!: HTMLInputElement;
    private _resultsList!: HTMLUListElement;

    private _provider: SearchProvider;
    private _options: { placeholder: string; debounceMs: number; minChars: number; maxResults: number };

    private _debounceTimeout?: number;
    private _results: SearchResult[] = [];
    private _selectedIndex = -1;

    constructor(options: SearchControlOptions) {
        this._provider = Array.isArray(options.providers) ? options.providers[0] : options.providers;
        this._options = {
            placeholder: options.placeholder ?? this._provider.placeholder ?? 'Rechercher',
            debounceMs: options.debounceMs ?? 300,
            minChars: options.minChars ?? 3,
            maxResults: options.maxResults ?? 5
        };
    }

    onAdd(map: Map): HTMLElement {
        this._map = map;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = TEMPLATE.trim();
        this._container = wrapper.firstElementChild as HTMLDivElement;
        this._container.classList.add('maplibregl-ctrl');

        this._input = this._container.querySelector('input')!;
        this._input.placeholder = this._options.placeholder;

        // Results list added to map container (avoids overflow issues with MapLibre controls)
        this._resultsList = document.createElement('ul');
        this._resultsList.className = 'cartefacile-ctrl-search__results';
        this._resultsList.setAttribute('role', 'listbox');
        map.getContainer().appendChild(this._resultsList);

        this._setupEvents();
        return this._container;
    }

    onRemove(): void {
        clearTimeout(this._debounceTimeout);
        this._resultsList.remove();
        this._container.remove();
        this._map = undefined;
    }

    getDefaultPosition(): ControlPosition {
        return 'top-left';
    }

    private _setupEvents(): void {
        // Debounced search
        this._input.addEventListener('input', () => {
            clearTimeout(this._debounceTimeout);
            const value = this._input.value;

            if (value.length < this._options.minChars) {
                this._hideResults();
                return;
            }

            this._debounceTimeout = window.setTimeout(() => this._search(value), this._options.debounceMs);
        });

        // Keyboard navigation
        this._input.addEventListener('keydown', (e) => {
            if (this._results.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this._setSelectedIndex(this._selectedIndex + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this._setSelectedIndex(this._selectedIndex - 1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this._selectedIndex >= 0) this._selectResult(this._selectedIndex);
                    break;
                case 'Escape':
                    this._hideResults();
                    break;
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this._container.contains(e.target as Node)) this._hideResults();
        });
    }

    private async _search(query: string): Promise<void> {
        if (!this._map) return;

        try {
            const results = await this._provider.search(query);
            this._results = results.slice(0, this._options.maxResults);
            this._selectedIndex = -1;
            this._displayResults();
        } catch (error) {
            console.warn('SearchControl: search failed', error);
        }
    }

    private _displayResults(): void {
        this._resultsList.innerHTML = '';

        if (this._results.length === 0) {
            this._hideResults();
            return;
        }

        this._results.forEach((result, index) => {
            const item = document.createElement('li');
            item.className = 'cartefacile-ctrl-search__result';
            item.setAttribute('role', 'option');

            const label = document.createElement('span');
            label.className = 'cartefacile-ctrl-search__result-label';
            label.textContent = result.label;
            item.appendChild(label);

            if (result.description) {
                const desc = document.createElement('span');
                desc.className = 'cartefacile-ctrl-search__result-desc';
                desc.textContent = result.description;
                item.appendChild(desc);
            }

            item.addEventListener('click', () => this._selectResult(index));
            item.addEventListener('mouseenter', () => this._setSelectedIndex(index));

            this._resultsList.appendChild(item);
        });

        // Position list below input (calculated because list is in map container)
        const rect = this._container.getBoundingClientRect();
        const mapRect = this._map!.getContainer().getBoundingClientRect();
        this._resultsList.style.top = `${rect.bottom - mapRect.top + 4}px`;
        this._resultsList.style.left = `${rect.left - mapRect.left}px`;
        this._resultsList.style.width = `${rect.width}px`;

        this._resultsList.classList.add('cartefacile-ctrl-search__results--visible');
    }

    private _selectResult(index: number): void {
        const result = this._results[index];
        if (!this._map || !result) return;

        this._provider.onSelect(result, this._map);
        this._input.value = result.label;
        this._hideResults();
    }

    private _setSelectedIndex(index: number): void {
        const max = this._results.length - 1;
        // Wrap around: after last → first, before first → last
        this._selectedIndex = index < 0 ? max : index > max ? 0 : index;

        this._resultsList.querySelectorAll('li').forEach((li, i) => {
            li.classList.toggle('cartefacile-ctrl-search__result--selected', i === this._selectedIndex);
        });
    }

    private _hideResults(): void {
        this._resultsList.classList.remove('cartefacile-ctrl-search__results--visible');
        this._results = [];
        this._selectedIndex = -1;
    }
}

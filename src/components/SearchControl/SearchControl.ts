import type { Map, IControl, ControlPosition } from 'maplibre-gl';
import '../../themes/styles/dsfr.css';
import '../Button/Button.css';
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
    /** Additional data (geometry, properties, etc.) */
    data?: unknown;
}

/**
 * Interface to implement a custom search provider
 */
export interface SearchProvider {
    name: string;
    placeholder?: string;
    search(query: string): Promise<SearchResult[]>;
    /** Action executed when a result is selected (move map, add marker, etc.) */
    onSelect(result: SearchResult, map: Map): void | Promise<void>;
    /** Called when the search is cleared or the control is removed. Use to clean up map layers, markers, etc. */
    onClear?(map: Map): void;
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
    /** Maximum results displayed per provider (default: 5) */
    maxResults?: number;
}

const TEMPLATE = `
<div class="maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-search"
     role="search"
     aria-label="Barre de recherche"
    >
    <label class="cartefacile-ctrl-search-label" for="cartefacile-search-input">Rechercher</label>
    <input
        class="cartefacile-ctrl-search-input"
        placeholder="Rechercher"
        id="cartefacile-search-input"
        type="search"
        autocomplete="off"
        role="combobox"
        aria-expanded="false"
        aria-controls="cartefacile-search-results"
        aria-autocomplete="list"
    >
    <button title="Rechercher" 
            class="cartefacile-btn 
            cartefacile-btn-icon 
            cartefacile-btn-icon--close-circle"
    ></button>
</div>
`;

/**
 * Search control for MapLibre GL
 *
 * @example
 * map.addControl(new SearchControl({
 *     providers: [GeopfGeocoder, AdminGeocoder]
 * }));
 */
export class SearchControl implements IControl {
    private _map?: Map;
    private _container!: HTMLDivElement;
    private _input!: HTMLInputElement;
    private _clearButton!: HTMLButtonElement;
    private _resultsList!: HTMLUListElement;

    private _providers: SearchProvider[];
    private _options: { placeholder: string; debounceMs: number; minChars: number; maxResults: number };

    private _debounceTimeout?: number;
    /** Flat list of displayed results with their provider reference */
    private _resultEntries: { result: SearchResult; provider: SearchProvider }[] = [];
    private _selectedIndex = -1;
    private _onDocumentClick?: (e: MouseEvent) => void;
    private _searchCounter = 0;
    private _currentQuery = '';

    constructor(options: SearchControlOptions) {
        this._providers = Array.isArray(options.providers) ? options.providers : [options.providers];
        this._options = {
            placeholder: options.placeholder ?? this._providers[0]?.placeholder ?? 'Rechercher',
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
        this._clearButton = this._container.querySelector('button')!;

        // Results list added to map container (avoids overflow issues with MapLibre controls)
        this._resultsList = document.createElement('ul');
        this._resultsList.className = 'cartefacile-ctrl-search__results';
        this._resultsList.id = 'cartefacile-search-results';
        this._resultsList.setAttribute('role', 'listbox');
        map.getContainer().appendChild(this._resultsList);

        this._setupEvents();
        return this._container;
    }

    onRemove(): void {
        clearTimeout(this._debounceTimeout);
        if (this._onDocumentClick) {
            document.removeEventListener('click', this._onDocumentClick);
        }
        if (this._map) {
            for (const provider of this._providers) {
                provider.onClear?.(this._map);
            }
        }
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
            if (this._resultEntries.length === 0) return;

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

        // Clear button
        this._clearButton.addEventListener('click', () => {
            this._input.value = '';
            if (this._map) {
                for (const provider of this._providers) {
                    provider.onClear?.(this._map);
                }
            }
            this._hideResults();
            this._input.focus();
        });

        // Close on outside click
        this._onDocumentClick = (e: MouseEvent) => {
            if (!this._container.contains(e.target as Node)) this._hideResults();
        };
        document.addEventListener('click', this._onDocumentClick);
    }

    private async _search(query: string): Promise<void> {
        if (!this._map) return;

        const requestId = ++this._searchCounter;

        this._currentQuery = query;

        const settled = await Promise.allSettled(
            this._providers.map(provider => provider.search(query))
        );

        // Ignore stale results if a newer search was triggered
        if (requestId !== this._searchCounter) return;

        this._resultEntries = [];
        for (let i = 0; i < this._providers.length; i++) {
            const outcome = settled[i];
            if (outcome.status === 'fulfilled') {
                const results = outcome.value.slice(0, this._options.maxResults);
                for (const result of results) {
                    this._resultEntries.push({ result, provider: this._providers[i] });
                }
            } else {
                console.warn(`SearchControl: provider "${this._providers[i].name}" failed`, outcome.reason);
            }
        }

        this._selectedIndex = -1;
        this._displayResults();
    }

    private _displayResults(): void {
        this._resultsList.innerHTML = '';

        if (this._resultEntries.length === 0) {
            this._hideResults();
            return;
        }

        this._resultEntries.forEach((entry, index) => {
            const item = document.createElement('li');
            item.className = 'cartefacile-ctrl-search__result';
            item.id = `cartefacile-search-result-${index}`;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');

            const label = document.createElement('span');
            label.className = 'cartefacile-ctrl-search__result-label';
            label.innerHTML = this._highlightText(entry.result.label, this._currentQuery);
            item.appendChild(label);

            if (entry.result.description) {
                const desc = document.createElement('span');
                desc.className = 'cartefacile-ctrl-search__result-desc';
                desc.innerHTML = this._highlightText(entry.result.description, this._currentQuery);
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
        this._input.setAttribute('aria-expanded', 'true');
    }

    private async _selectResult(index: number): Promise<void> {
        const entry = this._resultEntries[index];
        if (!this._map || !entry) return;

        // Clear all providers before selecting (e.g. remove previous highlights)
        for (const provider of this._providers) {
            provider.onClear?.(this._map);
        }

        try {
            await entry.provider.onSelect(entry.result, this._map);
        } catch (error) {
            console.warn(`SearchControl: onSelect failed for provider "${entry.provider.name}"`, error);
        }

        this._input.value = entry.result.label;
        this._hideResults();
    }

    private _setSelectedIndex(index: number): void {
        const max = this._resultEntries.length - 1;
        // Wrap around: after last → first, before first → last
        this._selectedIndex = index < 0 ? max : index > max ? 0 : index;

        this._resultsList.querySelectorAll('li').forEach((li, i) => {
            const isSelected = i === this._selectedIndex;
            li.classList.toggle('cartefacile-ctrl-search__result--selected', isSelected);
            li.setAttribute('aria-selected', String(isSelected));
        });

        this._input.setAttribute('aria-activedescendant', `cartefacile-search-result-${this._selectedIndex}`);
    }

    /** Returns HTML with matching query words wrapped in <strong>, XSS-safe */
    private _highlightText(text: string, query: string): string {
        // Escape HTML entities first to prevent XSS
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (!query) return escaped;

        // Build a regex that matches any word from the query (case-insensitive, accent-insensitive not needed: API already matched)
        const words = query.trim().split(/\s+/).filter(Boolean).map(
            w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        if (words.length === 0) return escaped;

        const pattern = new RegExp(`(${words.join('|')})`, 'gi');
        return escaped.replace(pattern, '<strong>$1</strong>');
    }

    private _hideResults(): void {
        this._resultsList.classList.remove('cartefacile-ctrl-search__results--visible');
        this._input.setAttribute('aria-expanded', 'false');
        this._input.removeAttribute('aria-activedescendant');
        this._resultEntries = [];
        this._selectedIndex = -1;
    }
}

import type { Map as MapType, IControl, ControlPosition } from "maplibre-gl";
import "../Button/Button.css";
import "./SearchControl.css";
import { GeopfGeocoder } from "./providers/GeopfGeocoder";

/**
 * Search result returned by a provider
 */
export interface SearchResult {
	id: string;
	label: string;
	description?: string;
	/** Result type key set by the provider (e.g. 'address', 'city', 'train', 'poi'). */
	type?: string;
	/** Icon to display in the results list (e.g. 'pin'). Set by the provider. */
	icon?: "pin";
	/** Location context displayed in gray after the label (city, postcode, etc.) */
	locationSuffix?: string;
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
	onSelect(result: SearchResult, map: MapType): void | Promise<void>;
	/** Called when the search is cleared or the control is removed. Use to clean up map layers, markers, etc. */
	onClear?(map: MapType): void;
}

/**
 * SearchControl configuration options
 */
export interface SearchControlOptions {
	providers?: SearchProvider | SearchProvider[];
	placeholder?: string;
	/** Delay before triggering search (default: 300ms) */
	debounceMs?: number;
	/** Minimum characters required (default: 3) */
	minChars?: number;
	/** Maximum results displayed per provider (default: 5) */
	maxResults?: number;
	/**
	 * Called when the user selects a result.
	 * Use this to access the full result data (INSEE code, raw API properties, etc.)
	 *
	 * @example
	 * import type { GeopfResultData } from 'carte-facile';
	 * onSelect: (result) => {
	 *   const data = result.data as GeopfResultData;
	 *   myService.fetchDataForCommune({ citycode: data.citycode });
	 * }
	 */
	onSelect?: (result: SearchResult) => void;
}

interface ResolvedOptions {
	placeholder: string;
	debounceMs: number;
	minChars: number;
	maxResults: number;
	onSelect?: (result: SearchResult) => void;
}

type ResultEntry = { result: SearchResult; provider: SearchProvider };

const TEMPLATE = `
<search class="maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-search">
    <label class="cartefacile-ctrl-search__label">Chercher un lieu</label>
    <div class="cartefacile-ctrl-search__field">
        <input
            class="cartefacile-ctrl-search__input"
            type="search"
            autocomplete="off"
            role="combobox"
            aria-expanded="false"
            aria-autocomplete="list"
        >
        <button class="cartefacile-btn-icon cartefacile-btn-icon--close cartefacile-ctrl-search__btn-clear">
          <span class="visually-hidden">Effacer la recherche</span>
        </button>
    </div>
    <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--search cartefacile-ctrl-search__btn-search">
      <span class="visually-hidden">Rechercher</span>
    </button>
</search>
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
	private static _idCounter = 0;

	private _id = 0;
	private _map?: MapType;
	private _container!: HTMLDivElement;
	private _input!: HTMLInputElement;
	private _label!: HTMLLabelElement;
	private _searchButton!: HTMLButtonElement;
	private _clearButton!: HTMLButtonElement;
	private _dropdown!: HTMLUListElement;

	private _providers: SearchProvider[];
	private _options: ResolvedOptions;

	private _debounceTimeout?: number;
	private _dropdownEntries: ResultEntry[] = [];
	private _selectedIndex = -1;
	private _documentClickHandler?: (e: MouseEvent) => void;
	private _requestId = 0;
	private _confirmedEntry?: ResultEntry;

	constructor(options: SearchControlOptions = {}) {
		const providers = options.providers ?? GeopfGeocoder;
		this._providers = Array.isArray(providers) ? providers : [providers];
		this._options = {
			placeholder: options.placeholder ?? this._providers[0]?.placeholder ?? "",
			debounceMs: options.debounceMs ?? 300,
			minChars: options.minChars ?? 3,
			maxResults: options.maxResults ?? 5,
			onSelect: options.onSelect,
		};
	}

	onAdd(map: MapType): HTMLElement {
		this._map = map;

		this._id = ++SearchControl._idCounter;
		const inputId = `cartefacile-search-input-${this._id}`;
		const dropdownId = `cartefacile-search-results-${this._id}`;

		const wrapper = document.createElement("div");
		wrapper.innerHTML = TEMPLATE.trim();
		this._container = wrapper.firstElementChild as HTMLDivElement;
		this._label = this._container.querySelector("label") as HTMLLabelElement;

		this._input = this._container.querySelector("input") as HTMLInputElement;
		this._input.id = inputId;
		this._input.placeholder = this._options.placeholder;
		this._input.setAttribute("aria-controls", dropdownId);
		this._label.setAttribute("for", inputId);
		this._clearButton = this._container.querySelector(
			".cartefacile-ctrl-search__btn-clear",
		) as HTMLButtonElement;
		this._searchButton = this._container.querySelector(
			".cartefacile-ctrl-search__btn-search",
		) as HTMLButtonElement;

		// Results list appended to map container (avoids overflow clipping by MapLibre controls)
		this._dropdown = document.createElement("ul");
		this._dropdown.className = "cartefacile-ctrl-search__results";
		this._dropdown.id = dropdownId;
		this._dropdown.setAttribute("role", "listbox");
		map.getContainer().appendChild(this._dropdown);

		this._bindInputEvents();
		this._bindButtonEvents();
		this._bindDocumentEvents();

		return this._container;
	}

	onRemove(): void {
		clearTimeout(this._debounceTimeout);
		if (this._documentClickHandler) {
			document.removeEventListener("click", this._documentClickHandler);
		}
		if (this._map) {
			for (const provider of this._providers) {
				provider.onClear?.(this._map);
			}
		}
		this._dropdown.remove();
		this._container.remove();
		this._map = undefined;
	}

	getDefaultPosition(): ControlPosition {
		return "top-left";
	}

	private _bindInputEvents(): void {
		this._input.addEventListener("input", () => {
			clearTimeout(this._debounceTimeout);
			const value = this._input.value;

			this._container.classList.toggle(
				"cartefacile-ctrl-search--has-value",
				value.length > 0,
			);

			if (value.length < this._options.minChars) {
				this._hideDropdown();
				return;
			}

			this._debounceTimeout = window.setTimeout(
				() => this._search(value),
				this._options.debounceMs,
			);
		});

		this._input.addEventListener("keydown", (e) => {
			if (this._dropdownEntries.length === 0) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					this._setSelectedIndex(this._selectedIndex + 1);
					break;
				case "ArrowUp":
					e.preventDefault();
					this._setSelectedIndex(this._selectedIndex - 1);
					break;
				case "Enter":
					e.preventDefault();
					this._confirmSelection();
					break;
				case "Escape":
					this._hideDropdown();
					break;
			}
		});
	}

	private _bindButtonEvents(): void {
		this._searchButton.addEventListener("click", () =>
			this._confirmSelection(),
		);

		this._clearButton.addEventListener("click", () => {
			this._input.value = "";
			this._confirmedEntry = undefined;
			this._container.classList.remove("cartefacile-ctrl-search--has-value");
			if (this._map) {
				for (const provider of this._providers) {
					provider.onClear?.(this._map);
				}
			}
			this._hideDropdown();
			this._input.focus();
		});
	}

	private _bindDocumentEvents(): void {
		this._documentClickHandler = (e: MouseEvent) => {
			if (!this._container.contains(e.target as Node)) this._hideDropdown();
		};
		document.addEventListener("click", this._documentClickHandler);
	}

	private async _search(query: string): Promise<void> {
		if (!this._map) return;

		const requestId = ++this._requestId;

		const settled = await Promise.allSettled(
			this._providers.map((provider) => provider.search(query)),
		);

		// Discard stale results if a newer search was triggered while awaiting
		if (requestId !== this._requestId) return;

		const entries: ResultEntry[] = [];
		for (let i = 0; i < this._providers.length; i++) {
			const outcome = settled[i];
			if (outcome.status === "fulfilled") {
				for (const result of outcome.value.slice(0, this._options.maxResults)) {
					entries.push({ result, provider: this._providers[i] });
				}
			} else {
				console.warn(
					`SearchControl: provider "${this._providers[i].name}" failed`,
					outcome.reason,
				);
			}
		}

		this._dropdownEntries = entries;
		this._selectedIndex = -1;
		this._renderDropdown(query);
	}

	private _renderDropdown(query: string): void {
		this._dropdown.innerHTML = "";

		if (this._dropdownEntries.length === 0) {
			this._hideDropdown();
			return;
		}

		this._dropdownEntries.forEach((entry, index) => {
			this._dropdown.appendChild(this._createResultItem(entry, index, query));
		});

		this._positionDropdown();
		this._dropdown.classList.add("cartefacile-ctrl-search__results--visible");
		this._input.setAttribute("aria-expanded", "true");
	}

	private _createResultItem(
		entry: ResultEntry,
		index: number,
		query: string,
	): HTMLLIElement {
		const item = document.createElement("li");
		item.className = "cartefacile-ctrl-search__result";
		item.id = `cartefacile-search-result-${this._id}-${index}`;
		item.setAttribute("role", "option");
		item.setAttribute("aria-selected", "false");

		if (entry.result.icon === "pin") {
			item.classList.add("cartefacile-ctrl-search__result--has-pin");
		}

		const text = document.createElement("span");
		text.className = "cartefacile-ctrl-search__result-text";

		const label = document.createElement("span");
		label.className = "cartefacile-ctrl-search__result-label";
		label.innerHTML = this._highlightText(entry.result.label, query);
		text.appendChild(label);

		if (entry.result.locationSuffix) {
			const location = document.createElement("span");
			location.className = "cartefacile-ctrl-search__result-desc";
			location.textContent = entry.result.locationSuffix;
			text.appendChild(location);
		}

		if (entry.result.description) {
			const desc = document.createElement("span");
			desc.className = "cartefacile-ctrl-search__result-desc";
			const d = entry.result.description;
			desc.textContent = d.charAt(0).toUpperCase() + d.slice(1);
			text.appendChild(desc);
		}

		item.appendChild(text);
		item.addEventListener("click", () => this._selectEntry(index));
		item.addEventListener("mouseenter", () => this._setSelectedIndex(index));

		return item;
	}

	private _positionDropdown(): void {
		const rect = this._container.getBoundingClientRect();
		const mapRect = this._map?.getContainer().getBoundingClientRect();

		this._dropdown.style.width = `${rect.width}px`;

		// Vertical: open below if there is more room below, above otherwise
		if (mapRect && mapRect.bottom - rect.bottom >= rect.top - mapRect.top) {
			this._dropdown.style.top = `${rect.bottom - mapRect.top + 8}px`;
			this._dropdown.style.bottom = "";
		} else if (mapRect) {
			this._dropdown.style.top = "";
			this._dropdown.style.bottom = `${mapRect.bottom - rect.top + 8}px`;
		}

		// Horizontal: align to the same side as the control
		if (
			mapRect &&
			rect.left + rect.width / 2 <= mapRect.left + mapRect.width / 2
		) {
			this._dropdown.style.left = `${rect.left - mapRect.left}px`;
			this._dropdown.style.right = "";
		} else if (mapRect) {
			this._dropdown.style.left = "";
			this._dropdown.style.right = `${mapRect.right - rect.right}px`;
		}
	}

	// If the dropdown is open: select the highlighted item, or the first one by default.
	// If the dropdown is closed: re-apply the last confirmed selection (e.g. search button clicked again).
	private _confirmSelection(): void {
		if (this._dropdownEntries.length > 0) {
			const index = this._selectedIndex >= 0 ? this._selectedIndex : 0;
			this._selectEntry(index);
		} else if (this._confirmedEntry) {
			this._applyEntry(this._confirmedEntry);
		}
	}

	private async _selectEntry(index: number): Promise<void> {
		const entry = this._dropdownEntries[index];
		if (!entry) return;

		this._confirmedEntry = entry;
		this._input.value = entry.result.locationSuffix
			? `${entry.result.label}, ${entry.result.locationSuffix}`
			: entry.result.label;
		this._container.classList.add("cartefacile-ctrl-search--has-value");
		this._hideDropdown();
		await this._applyEntry(entry);
	}

	private async _applyEntry(entry: ResultEntry): Promise<void> {
		if (!this._map) return;

		for (const provider of this._providers) {
			provider.onClear?.(this._map);
		}

		try {
			await entry.provider.onSelect(entry.result, this._map);
		} catch (error) {
			console.warn(
				`SearchControl: onSelect failed for provider "${entry.provider.name}"`,
				error,
			);
		}

		this._options.onSelect?.(entry.result);
	}

	private _setSelectedIndex(index: number): void {
		const max = this._dropdownEntries.length - 1;
		this._selectedIndex = index < 0 ? max : index > max ? 0 : index;

		this._dropdown.querySelectorAll("li").forEach((li, i) => {
			const selected = i === this._selectedIndex;
			li.classList.toggle(
				"cartefacile-ctrl-search__result--selected",
				selected,
			);
			li.setAttribute("aria-selected", String(selected));
		});

		this._input.setAttribute(
			"aria-activedescendant",
			`cartefacile-search-result-${this._id}-${this._selectedIndex}`,
		);
	}

	/** Returns HTML with matching query words wrapped in <strong>. XSS-safe. */
	private _highlightText(text: string, query: string): string {
		const escaped = text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		if (!query) return escaped;

		const words = query
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
		if (words.length === 0) return escaped;

		return escaped.replace(
			new RegExp(`(${words.join("|")})`, "gi"),
			"<strong>$1</strong>",
		);
	}

	private _hideDropdown(): void {
		this._dropdown.classList.remove(
			"cartefacile-ctrl-search__results--visible",
		);
		this._input.setAttribute("aria-expanded", "false");
		this._input.removeAttribute("aria-activedescendant");
		this._dropdownEntries = [];
		this._selectedIndex = -1;
	}
}

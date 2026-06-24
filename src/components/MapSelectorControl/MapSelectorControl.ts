import {
	mapStyles,
	mapThumbnails,
	addOverlay,
	removeOverlay,
	mapOverlays,
} from "../../maps/maps"
import type { OverlayType } from "../../maps/types"
import { Overlay } from "../../maps/types"
import "../Button/Button.css"
import "./MapSelectorControl.css"

/**
 * Configuration options for the MapSelectorControl
 */
export interface MapSelectorOptions {
	/** Available map styles to show in the selector (default: all styles) */
	styles?: (keyof typeof mapStyles)[]
	/** Available overlays to show in the selector (default: all overlays) */
	overlays?: OverlayType[]
}

/** Shape of the custom `metadata.fr` field present in the project's map styles */
type MapStyleMetadata = { fr?: { name?: string } }

/**
 * Simple utility to create elements from template strings
 */
function createFromTemplate(template: string): HTMLElement {
	const wrapper = document.createElement("div")
	wrapper.innerHTML = template.trim()
	return wrapper.firstElementChild as HTMLElement
}

/**
 * HTML templates for all UI component elements
 */
const TEMPLATES = {
	container: `
        <div class="maplibregl-ctrl maplibregl-ctrl-group"
            aria-label="Sélecteur de carte">
        </div>
    `,

	toggleButton: `
        <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--stack" 
                aria-expanded="false"
                aria-controls="map-selector-panel">
                <span class="visually-hidden">Ouvrir le sélecteur de cartes et surcouches</span>
        </button>
    `,

	panel: `
        <dialog id="map-selector-panel" class="maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-map-selector-panel">
          
          <button class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--close-circle cartefacile-btn--close">
              <span class="visually-hidden">Fermer le sélecteur de cartes</span>
          </button>
          
          <h2 id="styles-heading">Cartes</h2>
          <fieldset class="cartefacile-ctrl-map-selector-card-list" aria-labelledby="styles-heading">
          </fieldset>
          
          <h2 id="overlays-heading">Surcouches</h2>
          <fieldset class="cartefacile-ctrl-map-selector-card-list" aria-labelledby="overlays-heading">
          </fieldset>
        </dialog>
    `,

	card: `
        <div>
          <label class="cartefacile-ctrl-map-selector-card">
            <input></input>
            <img alt="" width="40" height="40">
            <span id="label-text"></span>
          </label>
        </div>
    `,
}

/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements maplibregl.IControl {
	private _map?: maplibregl.Map
	private _options: Required<MapSelectorOptions>
	private _panel?: HTMLDialogElement
	private _toggleButton?: HTMLButtonElement

	constructor(options: MapSelectorOptions = {}) {
		this._options = {
			styles:
				options.styles ||
				(Object.keys(mapStyles) as (keyof typeof mapStyles)[]),
			overlays: options.overlays || Object.values(Overlay),
		}
	}

	/** Creates and initializes the control structure */
	onAdd(map: maplibregl.Map): HTMLElement {
		this._map = map

		// Create the main control container from the HTML template
		const container = createFromTemplate(TEMPLATES.container)

		// Create the toggle button to open/close the selector panel
		this._toggleButton = createFromTemplate(
			TEMPLATES.toggleButton,
		) as HTMLButtonElement

		// Create the panel for selecting map styles and overlays
		this._panel = this._createPanel()

		// Add panel to map container
		map.getContainer().appendChild(this._panel)
		this._setupEventHandlers()

		// Sync panel state after map is loaded
		if (map.loaded()) {
			this._syncPanelState()
		} else {
			map.once("load", () => this._syncPanelState())
		}

		container.appendChild(this._toggleButton)
		return container
	}

	/** Creates the main selector panel with style and overlay sections */
	private _createPanel(): HTMLDialogElement {
		const panel = createFromTemplate(TEMPLATES.panel) as HTMLDialogElement

		const [stylesContainer, overlaysContainer] = panel.querySelectorAll(
			".cartefacile-ctrl-map-selector-card-list",
		)
		this._populateCards(stylesContainer as HTMLDivElement, "style")
		this._populateCards(overlaysContainer as HTMLDivElement, "overlay")

		return panel
	}

	/** Creates a card element from template */
	private _createCard(
		id: string,
		title: string,
		thumbnail: string,
		type: "style" | "overlay",
		onChange: () => void,
	): HTMLElement {
		const card = createFromTemplate(TEMPLATES.card)
		const input = card.querySelector("input") as HTMLInputElement
		const label = card.querySelector("label") as HTMLLabelElement
		const labelText = label.querySelector("span") as HTMLSpanElement
		// Configure card attributes securely
		input.setAttribute("id", id)
		input.setAttribute("data-type", type)
		input.setAttribute("name", type === "style" ? "styles" : "")
		input.setAttribute("type", type === "style" ? "radio" : "checkbox")
		label.setAttribute("for", id)

		// Configure image securely
		const img = label.querySelector("img") as HTMLImageElement
		img.src = thumbnail

		// Configure title securely
		labelText.textContent = title

		// Add event listeners
		card.addEventListener("change", onChange)

		return card
	}

	/** Populates containers with cards based on type */
	private _populateCards(
		container: HTMLDivElement,
		type: "style" | "overlay",
	): void {
		if (type === "style") {
			Object.entries(mapStyles)
				.filter(([key]) =>
					this._options.styles.includes(key as keyof typeof mapStyles),
				)
				.forEach(([key, styleObj]) => {
					const title =
						(styleObj.metadata as MapStyleMetadata | undefined)?.fr?.name ??
						"Style sans nom"
					const thumbnail =
						mapThumbnails[key as keyof typeof mapThumbnails] || ""
					const card = this._createCard(key, title, thumbnail, "style", () =>
						this._onStyleChange(styleObj),
					)
					container.appendChild(card)
				})
		} else {
			Object.values(Overlay)
				.filter((id) => this._options.overlays.includes(id as OverlayType))
				.forEach((id) => {
					const overlay = mapOverlays[id as keyof typeof mapOverlays]
					const title =
						(overlay?.neutral.metadata as MapStyleMetadata | undefined)?.fr
							?.name ?? "Surcouche sans nom"
					const thumbnail =
						mapThumbnails[id as keyof typeof mapThumbnails] || ""
					const card = this._createCard(id, title, thumbnail, "overlay", () =>
						this._onOverlayClick(id, card),
					)
					container.appendChild(card)
				})
		}
	}

	/** Sets up essential event handlers for AAA compliance */
	private _setupEventHandlers(): void {
		if (!this._panel || !this._toggleButton) return

		this._toggleButton.addEventListener("click", () => this._openPanel())
		this._panel
			.querySelector(".cartefacile-btn--close")
			?.addEventListener("click", () => this._closePanel())
	}

	/** Opens the panel with focus management */
	private _openPanel(): void {
		if (!this._panel || !this._toggleButton) return

		this._panel.showModal()
		this._toggleButton.setAttribute("aria-expanded", "true")
	}

	/** Closes the panel */
	private _closePanel(): void {
		if (!this._panel || !this._toggleButton) return

		this._panel.close()
		this._toggleButton.setAttribute("aria-expanded", "false")
	}

	/** Syncs panel state with current map configuration */
	// TODO: adapt to the new logic
	private _syncPanelState(): void {
		if (!this._map || !this._panel) return

		try {
			const currentStyle = this._map.getStyle()

			// Sync style cards
			this._panel.querySelectorAll('[data-type="style"]').forEach((card) => {
				const cardElement = card as HTMLElement
				const styleId = cardElement.dataset.id
				const isActive =
					currentStyle.name === styleId ||
					(styleId === "simple" &&
						(!currentStyle.name || currentStyle.name === "simple"))

				cardElement.classList.toggle("active", isActive)
				cardElement.setAttribute("aria-checked", isActive.toString())
			})

			// Sync overlay cards
			this._panel.querySelectorAll('[data-type="overlay"]').forEach((card) => {
				const cardElement = card as HTMLElement
				const overlayId = cardElement.dataset.id as OverlayType
				const overlay = mapOverlays[overlayId]
				if (!overlay) return

				const hasOverlay = Object.keys(overlay.neutral.sources).some(
					(sourceId) => this._map!.getSource(sourceId),
				)
				cardElement.classList.toggle("active", hasOverlay)
				cardElement.setAttribute("aria-checked", hasOverlay.toString())
			})
		} catch (error) {
			console.warn("Failed to sync panel state:", error)
		}
	}

	/** Handles style card click - changes map style */
	private _onStyleChange(styleObj: maplibregl.StyleSpecification): void {
		if (!this._map?.getContainer()) {
			console.warn("Map is not available")
			return
		}

		try {
			this._map.setStyle(styleObj)
		} catch (error) {
			console.error("Failed to set map style:", error)
		}
	}

	// /** Handles overlay card click - toggles overlay visibility */
	private _onOverlayClick(overlayId: string, card: HTMLElement): void {
		if (!this._map?.getContainer()) {
			console.warn("Map is not available")
			return
		}

		try {
			const isActive = card.querySelector("input")?.checked

			if (isActive) {
				addOverlay(this._map, overlayId as OverlayType)
			} else {
				removeOverlay(this._map, overlayId as OverlayType)
			}
		} catch (error) {
			console.error("Failed to toggle overlay:", error)
		}
	}

	/** Cleanup when control is removed */
	onRemove(): void {
		this._panel?.remove()
		this._map = undefined
		this._panel = undefined
		this._toggleButton = undefined
	}

	/** Default position for the control */
	getDefaultPosition(): maplibregl.ControlPosition {
		return "top-right"
	}
}

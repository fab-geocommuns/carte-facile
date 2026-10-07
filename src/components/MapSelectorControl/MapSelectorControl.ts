import type { ControlPosition, IControl, MapLibreMap, StyleSpecification } from "maplibre-gl"
import {
	addOverlay,
	mapOverlays,
	mapStyles,
	mapThumbnails,
	removeOverlay
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
    <div class="maplibregl-ctrl maplibregl-ctrl-group">
    </div>
  `,
	toggleButton: `
    <button
      class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--stack" popovertarget="map-selector-panel" title="Ouvrir le sélecteur de styles et surcouches" aria-labelledby="panel-title"></button>
  `,
	panel: `
    <dialog popover="manual" id="map-selector-panel" class="maplibregl-ctrl maplibregl-ctrl-group cartefacile-ctrl-map-selector-panel">
      <p id="panel-title" class="visually-hidden">Sélecteur de styles et de surcouches</p>
      <button popovertarget="map-selector-panel" popovertargetaction="hide" class="cartefacile-btn cartefacile-btn-icon cartefacile-btn-icon--close-circle cartefacile-btn--close">
          Fermer <span class="visually-hidden">le sélecteur de styles et surcouches</span>
      </button>
      <div>
				<h2 id="styles-heading">Styles</h2>
				<fieldset class="cartefacile-ctrl-map-selector-card-list" aria-labelledby="styles-heading">
				</fieldset>
			</div>
      <div>
				<h2 id="overlays-heading">Surcouches</h2>
				<fieldset class="cartefacile-ctrl-map-selector-card-list" aria-labelledby="overlays-heading">
				</fieldset>
			</div>
    </dialog>
  `,
	card: `
    <div>
      <label class="cartefacile-ctrl-map-selector-card">
        <input>
        <img alt="" width="40" height="40">
        <span id="label-text"></span>
      </label>
    </div>
  `
}
/**
 * MapLibre control for selecting map styles and overlays
 * Provides a toggle button that opens a panel with style and overlay options
 */
export class MapSelectorControl implements IControl {
	private static _nextInstanceId = 0
	private readonly _instanceId = ++MapSelectorControl._nextInstanceId
	private _map?: MapLibreMap
	private _selectedStyleId?: keyof typeof mapStyles
	private _options: Required<MapSelectorOptions>
	private _panel?: HTMLDialogElement
	private _toggleButton?: HTMLButtonElement
	constructor(options: MapSelectorOptions = {}) {
		this._options = {
			styles:
				options.styles ||
				(Object.keys(mapStyles) as (keyof typeof mapStyles)[]),
			overlays: options.overlays || Object.values(Overlay)
		}
	}
	/** Creates and initializes the control structure */
	onAdd(map: MapLibreMap): HTMLElement {
		this._map = map
		// Create the main control container from the HTML template
		const container = createFromTemplate(TEMPLATES.container)
		// Create the toggle button to open/close the selector panel
		this._toggleButton = createFromTemplate(
			TEMPLATES.toggleButton
		) as HTMLButtonElement
		// Create the panel for selecting map styles and overlays
		this._panel = this._createPanel()
		// Add panel to map container
		this._setupEventHandlers()
		// Sync panel state after map is loaded
		if (map.loaded()) {
			this._syncPanelState()
		} else {
			map.once("load", () => {
				if (this._map === map) this._syncPanelState()
			})
		}
		container.appendChild(this._toggleButton)
		container.appendChild(this._panel)
		return container
	}
	/** Creates the main selector panel with style and overlay sections */
	private _createPanel(): HTMLDialogElement {
		const panel = createFromTemplate(TEMPLATES.panel) as HTMLDialogElement
		const [stylesContainer, overlaysContainer] = panel.querySelectorAll(
			".cartefacile-ctrl-map-selector-card-list"
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
		onChange: () => void
	): HTMLElement {
		const card = createFromTemplate(TEMPLATES.card)
		const input = card.querySelector("input") as HTMLInputElement
		const label = card.querySelector("label") as HTMLLabelElement
		const labelText = label.querySelector("span") as HTMLSpanElement
		// Configure card attributes securely
		const inputId = `map-selector-${this._instanceId}-${type}-${id}`
		input.id = inputId
		input.setAttribute("data-type", type)
		input.setAttribute("data-id", id)
		if (type === "style") input.name = `styles-${this._instanceId}`
		input.setAttribute("type", type === "style" ? "radio" : "checkbox")
		label.htmlFor = inputId
		labelText.id = `${inputId}-text`
		// Configure image securely
		const img = card.querySelector("img") as HTMLImageElement
		img.src = thumbnail
		// Configure title securely
		labelText.textContent = title
		// Add event listeners
		input.addEventListener("change", onChange)
		return card
	}
	/** Populates containers with cards based on type */
	private _populateCards(
		container: HTMLDivElement,
		type: "style" | "overlay"
	): void {
		if (type === "style") {
			Object.entries(mapStyles)
				.filter(([key]) =>
					this._options.styles.includes(key as keyof typeof mapStyles)
				)
				.forEach(([key, styleObj]) => {
					const title =
						(styleObj.metadata as MapStyleMetadata | undefined)?.fr?.name ??
						"Style sans nom"
					const thumbnail =
						mapThumbnails[key as keyof typeof mapThumbnails] || ""
					const card = this._createCard(key, title, thumbnail, "style", () =>
						this._onStyleChange(key as keyof typeof mapStyles, styleObj)
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
						this._onOverlayChange(id, card.querySelector("input") as HTMLInputElement)
					)
					container.appendChild(card)
				})
		}
	}
	/** Sets up essential event handlers for a11y compliance */
	private _setupEventHandlers(): void {
		if (!this._panel) return
		// handle close on escape key
		this._panel.addEventListener("keydown", (event) => {
			if (event.code === "Escape")
				this._closePanel()
		}
		)
	}
	/** Opening the panel is handled by the native popover API */
	/** Closes the panel */
	private _closePanel(): void {
		if (!this._panel) return
		this._panel.hidePopover()
		this._toggleButton?.focus()
	}

	/** Syncs panel state with current map configuration */
	private _syncStylesState(): void {
		if (!this._map || !this._panel) return
		if (!this._selectedStyleId) {
			const currentName = this._map.getStyle().name
			this._selectedStyleId = this._options.styles.find((key) =>
				Boolean(currentName) &&
				(currentName === key || currentName === mapStyles[key].name)
			) ?? (!currentName && this._options.styles.includes("simple") ? "simple" : undefined)
		}
		this._panel.querySelectorAll('[data-type="style"]').forEach((card) => {
			const cardElement = card as HTMLInputElement
			const isActive = cardElement.dataset.id === this._selectedStyleId
			cardElement.checked = isActive
		})
	}
	private _syncOverlaysState(): void {
		if (!this._map || !this._panel) return
		this._panel.querySelectorAll('[data-type="overlay"]').forEach((card) => {
			const cardElement = card as HTMLInputElement
			const overlayId = cardElement.dataset.id as OverlayType
			const overlay = mapOverlays[overlayId]
			if (!overlay) return
			const variants = Object.values(overlay) as Array<{ layers?: { id: string }[] }>
			const hasOverlay = variants.some((variant) =>
				Array.isArray(variant?.layers) &&
				variant.layers.length > 0 &&
				variant.layers.every((layer) => Boolean(this._map?.getLayer(layer.id)))
			)
			cardElement.checked = hasOverlay
		})
	}
	private _syncPanelState(): void {
		if (!this._map || !this._panel) return
		try {
			this._syncStylesState()
			this._syncOverlaysState()
		} catch (error) {
			console.warn("Failed to sync panel state:", error)
		}
	}
	/** Handles style card click - changes map style */
	private _onStyleChange(styleId: keyof typeof mapStyles, styleObj: StyleSpecification): void {
		if (!this._map?.getContainer()) {
			console.warn("Map is not available")
			return
		}
		const previousStyleId = this._selectedStyleId
		try {
			const map = this._map
			map.setStyle(styleObj)
			this._selectedStyleId = styleId
			this._syncStylesState()
			map.once("style.load", () => {
				// The map's overlay helper keeps overlays visible across style changes.
				// Layer IDs can change with the style, so keep the user's checkbox choices.
				if (this._map === map) this._syncStylesState()
			})
		} catch (error) {
			console.error("Failed to set map style:", error)
			this._selectedStyleId = previousStyleId
			this._syncStylesState()
		}
	}
	/** Handles a change to the selected overlay input. */
	private _onOverlayChange(overlayId: string, input: HTMLInputElement): void {

		if (!this._map?.getContainer()) {
			console.warn("Map is not available")
			return
		}
		try {
			const isActive = input.checked
			if (isActive) {
				addOverlay(this._map, overlayId as OverlayType)
			} else {
				removeOverlay(this._map, overlayId as OverlayType)
			}
		} catch (error) {
			console.error("Failed to toggle overlay:", error)
			input.checked = !input.checked
		}
	}
	/** Cleanup when control is removed */
	onRemove(): void {
		this._panel?.remove()
		this._map = undefined
		this._selectedStyleId = undefined
		this._panel = undefined
		this._toggleButton = undefined
	}
	/** Default position for the control */
	getDefaultPosition(): ControlPosition {
		return "top-right"
	}
}

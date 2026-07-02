import type { ControlPosition, IControl, Map as MapType } from "maplibre-gl"
import "./ZoomLevelControl.css"

export class ZoomLevelControl implements IControl {
	private _container!: HTMLDivElement

	onAdd(map: MapType): HTMLElement {
		this._container = document.createElement("div")
		this._container.className = "maplibregl-ctrl maplibregl-ctrl-group"

		const label = document.createElement("div")
		label.className = "cartefacile-ctrl-zoom-level"
		label.textContent = "Zoom : "
		const value = document.createElement("span")
		value.textContent = map.getZoom().toFixed(1)
		this._container.appendChild(label)
		label.appendChild(value)

		map.on("zoom", () => {
			value.textContent = map.getZoom().toFixed(1)
		})

		return this._container
	}

	onRemove(): void {
		this._container.parentNode?.removeChild(this._container)
	}

	getDefaultPosition(): ControlPosition {
		return "top-right"
	}
}

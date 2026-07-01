import { Map as MapLibre } from "maplibre-gl"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { MapSelectorControl } from "../../src"

function createTestMap() {
	document.body.innerHTML = `<div id="map"></div>`

	const map = new MapLibre({
		container: "map",
		style: {
			version: 8,
			sources: {},
			layers: []
		}
	})

	map.addControl(new MapSelectorControl())

	const setStyleSpy = vi.spyOn(map, "setStyle")
	const setOverlaySpy = vi.spyOn(map, "addLayer")

	return { map, setStyleSpy, setOverlaySpy }
}

let map: MapLibre
let setStyleSpy: ReturnType<typeof vi.spyOn>
let setOverlaySpy: ReturnType<typeof vi.spyOn>

describe("MapSelectorControl test suite", () => {
	beforeEach(async () => {
		;({ map, setStyleSpy, setOverlaySpy } = createTestMap())

		// clean up function, called once after all tests run
		return async () => {
			map.remove()
			document.body.innerHTML = ""
		}
	})

	const buttonText = "Ouvrir le sélecteur de styles et surcouches"
	const openButton = page.getByRole("button", { name: buttonText })
	const closeButton = page.getByRole("button", {
		name: "Fermer le sélecteur",
		includeHidden: true
	})
	const selectorDialog = page.getByRole("dialog", { includeHidden: true })

	test("renders the elements", async () => {
		// await new Promise((resolve) => map.once("load", resolve))

		const buttonSpan = openButton.getByText(buttonText)

		await expect.element(openButton).toBeVisible()
		await expect.element(openButton).toHaveAttribute("aria-expanded", "false")
		await expect
			.element(openButton)
			.toHaveAttribute("aria-controls", "map-selector-panel")
		await expect.element(buttonSpan).toHaveClass("visually-hidden")

		await expect.element(selectorDialog).toBeInTheDocument()
		await expect.element(selectorDialog).not.toBeVisible()
	})

	test("opens and closes the dialog", async () => {
		await openButton.click()
		await expect.element(selectorDialog).toBeVisible()
		await expect.element(openButton).toHaveAttribute("aria-expanded", "true")

		await closeButton.click()
		await expect.element(selectorDialog).not.toBeVisible()
		await expect.element(openButton).toHaveAttribute("aria-expanded", "false")
	})

	test("renders style and overlay inputs", async () => {
		await openButton.click()

		// styles radios
		await expect
			.element(page.getByRole("group", { name: "styles" }))
			.toBeInTheDocument()

		await expect
			.element(page.getByRole("radio", { name: "Simple", exact: true }))
			.toBeVisible()
		await expect
			.element(page.getByRole("radio", { name: "Simple", exact: true }))
			.toBeChecked()
		await expect
			.element(page.getByRole("radio", { name: "Simple", exact: true }))
			.toHaveAttribute("aria-checked", "true")

		await expect
			.element(page.getByRole("radio", { name: "Simple (OSM)", exact: true }))
			.toBeVisible()
		await expect
			.element(page.getByRole("radio", { name: "Simple (OSM)", exact: true }))
			.toHaveAttribute("aria-checked", "false")

		await expect
			.element(page.getByRole("radio", { name: "Aérienne" }))
			.toBeVisible()
		await expect
			.element(page.getByRole("radio", { name: "Aérienne" }))
			.toHaveAttribute("aria-checked", "false")

		await expect
			.element(page.getByRole("radio", { name: "Désaturée" }))
			.toBeVisible()
		await expect
			.element(page.getByRole("radio", { name: "Désaturée" }))
			.toHaveAttribute("aria-checked", "false")

		// overlays checkboxes
		await expect
			.element(page.getByRole("group", { name: "surcouches" }))
			.toBeInTheDocument()

		await expect
			.element(page.getByRole("checkbox", { name: "cadastre" }))
			.toBeVisible()
		await expect
			.element(page.getByRole("checkbox", { name: "cadastre" }))
			.not.toBeChecked()
		await expect
			.element(page.getByRole("checkbox", { name: "cadastre" }))
			.toHaveAttribute("aria-checked", "false")

		await expect
			.element(page.getByRole("checkbox", { name: "limites administratives" }))
			.toBeVisible()
		await expect
			.element(page.getByRole("checkbox", { name: "limites administratives" }))
			.not.toBeChecked()
		await expect
			.element(page.getByRole("checkbox", { name: "limites administratives" }))
			.toHaveAttribute("aria-checked", "false")

		await expect
			.element(page.getByRole("checkbox", { name: "courbes de niveau" }))
			.toBeVisible()
		await expect
			.element(page.getByRole("checkbox", { name: "courbes de niveau" }))
			.not.toBeChecked()
		await expect
			.element(page.getByRole("checkbox", { name: "courbes de niveau" }))
			.toHaveAttribute("aria-checked", "false")
	})

	test("style updates", async () => {
		await openButton.click()
		await page.getByRole("radio", { name: "désaturée" }).click()
		await expect
			.element(page.getByRole("radio", { name: "désaturée" }))
			.toBeChecked()
		await expect
			.element(page.getByRole("radio", { name: "désaturée" }))
			.toHaveAttribute("aria-checked", "true")

		expect(setStyleSpy).toHaveBeenCalled()
	})

	test("overlay updates", async () => {
		await openButton.click()
		await page.getByRole("checkbox", { name: "cadastre" }).click()
		await expect
			.element(page.getByRole("checkbox", { name: "cadastre" }))
			.toBeChecked()
		await expect
			.element(page.getByRole("checkbox", { name: "cadastre" }))
			.toHaveAttribute("aria-checked", "true")

		expect(setOverlaySpy).toHaveBeenCalled()
	})

	test("keyboard actions", async () => {
		await userEvent.tab()
		await userEvent.tab()
		expect(openButton).toHaveFocus()

		await userEvent.keyboard("{enter}")

		expect(closeButton).toHaveFocus()

		await expect.element(selectorDialog).toBeVisible()
		await expect.element(openButton).toHaveAttribute("aria-expanded", "true")

		await userEvent.tab()
		await userEvent.keyboard("{arrowdown}")
		await userEvent.keyboard("{arrowdown}")

		expect(page.getByRole("radio", { name: "Aérienne" })).toHaveFocus()

		await userEvent.tab()

		expect(page.getByRole("checkbox", { name: "cadastre" })).toHaveFocus()

		// BUG: does not trigger a spacebar press
		// await userEvent.keyboard(" ")

		await userEvent.keyboard("{escape}")
		expect(openButton).toHaveFocus()
	})
})

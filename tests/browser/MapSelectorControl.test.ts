import axe from "axe-core"
import { Map as MapLibre } from "maplibre-gl"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { type Locator, page, userEvent } from "vitest/browser"
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

async function tabTo(locator: Locator, maxTabs = 10) {
	const target = locator.element()
	for (let i = 0; i < maxTabs; i++) {
		await userEvent.tab()
		if (document.activeElement === target) return
	}
	throw new Error(`Element not reachable by Tab within ${maxTabs} presses`)
}

describe("MapSelectorControl test suite", () => {
	beforeEach(async () => {
		; ({ map, setStyleSpy, setOverlaySpy } = createTestMap())

		await new Promise((resolve) => map.once("load", resolve))
		// clean up function
		return async () => {
			map.remove()
			document.body.innerHTML = ""
		}
	})

	const buttonText = "Sélecteur de styles et de surcouches"
	const openButton = page.getByLabelText(buttonText)
	const closeButton = page.getByRole("button", {
		name: "Fermer le sélecteur",
		includeHidden: true
	})
	const selectorDialog = page.getByRole("dialog", { includeHidden: true })
	const cadastre = page.getByRole("checkbox", { name: "Cadastre", exact: true })
	const aerienne = page.getByRole("radio", { name: "Aérienne", exact: true })

	test("renders the elements", async () => {
		await expect.element(openButton).toBeVisible()
		await expect
			.element(openButton)
			.toHaveAttribute("popovertarget", "map-selector-panel")
		await expect.element(openButton).toHaveAccessibleName(buttonText)

		await expect.element(selectorDialog).toBeInTheDocument()
		await expect.element(selectorDialog).not.toBeVisible()
	})

	test("opens and closes the dialog", async () => {
		await openButton.click()
		await expect.element(selectorDialog).toBeVisible()

		await closeButton.click()
		await expect.element(selectorDialog).not.toBeVisible()
	})

	test("renders style and overlay inputs", async () => {
		await openButton.click()

		// styles radios
		await expect
			.element(page.getByRole("group", { name: "Styles", exact: true }))
			.toBeInTheDocument()
		const styles = [
			["Simple", true],
			["Simple (OSM)", false],
			["Aérienne", false],
			["Désaturée", false]
		] as const

		for (const [name, checked] of styles) {
			const radio = page.getByRole("radio", { name, exact: true })
			await expect.element(radio).toBeVisible()
			if (checked) await expect.element(radio).toBeChecked()
			else await expect.element(radio).not.toBeChecked()
		}

		// overlays checkboxes
		await expect
			.element(page.getByRole("group", { name: "Surcouches", exact: true }))
			.toBeInTheDocument()
		for (const name of [
			"Cadastre",
			"Limites administratives",
			"Courbes de niveau"
		]) {
			const box = page.getByRole("checkbox", { name, exact: true })
			await expect.element(box).toBeVisible()
			await expect.element(box).not.toBeChecked()
		}
	})

	// need better testing for styles and overlays set
	test("style updates", async () => {
		await openButton.click()
		await page.getByRole("radio", { name: "Désaturée", exact: true }).click()
		await expect
			.element(page.getByRole("radio", { name: "Désaturée", exact: true }))
			.toBeChecked()

		expect(setStyleSpy).toHaveBeenCalled()
	})

	test("overlay updates", async () => {
		await openButton.click()
		await cadastre.click()
		await expect.element(cadastre).toBeChecked()

		expect(setOverlaySpy).toHaveBeenCalled()
	})

	const layersInGroup = (group: string) =>
		map.getStyle().layers.filter(
			(l) => (l.metadata as Record<string, unknown> | undefined)?.["cartefacile:group"] === group,
		)

	test("overlay toggles layers on the map", async () => {
		const box = page.getByRole("checkbox", { name: "Cadastre", exact: true })
		await openButton.click()

		await box.click()
		await expect.poll(() => layersInGroup("cadastral_parcels").length).toBeGreaterThan(0)

		await box.click()
		await expect.poll(() => layersInGroup("cadastral_parcels").length).toBe(0)
	})

	test("overlay survives a style change", async () => {
		await openButton.click()
		await page.getByRole("checkbox", { name: "Cadastre", exact: true }).click()
		await expect.poll(() => layersInGroup("cadastral_parcels").length).toBeGreaterThan(0)

		await page.getByRole("radio", { name: "Aérienne", exact: true }).click()

		await expect.poll(() => layersInGroup("cadastral_parcels").length).toBeGreaterThan(0)
	})

	test("button is keyboard reachable", async () => {
		tabTo(openButton)
		await expect.element(openButton).toHaveFocus()
	})

	test("keyboard actions", async () => {
		openButton.element().focus()
		await expect.element(openButton).toHaveFocus()

		await userEvent.keyboard("{Enter}")

		await expect.element(closeButton).toHaveFocus()

		await expect.element(selectorDialog).toBeVisible()

		await userEvent.tab()
		await userEvent.keyboard("{ArrowDown}")
		await userEvent.keyboard("{ArrowDown}")

		await expect.element(aerienne).toHaveFocus()

		await userEvent.tab()

		await expect.element(cadastre).toHaveFocus()

		// BUG: does not trigger a spacebar press
		await userEvent.keyboard("[Space]")
		await expect.element(cadastre).toBeChecked()

		await userEvent.keyboard("{Escape}")
		await expect.element(openButton).toHaveFocus()
	})

	test("dialog axe accessibility checks", async () => {
		await openButton.click()
		await expect.element(selectorDialog).toBeVisible()
		const results = await axe.run(selectorDialog.element())
		expect(results.violations).toEqual([])
	})
})

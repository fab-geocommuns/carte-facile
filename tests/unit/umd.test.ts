/**
 * @vitest-environment jsdom
 */

/**
 * Test suite for the UMD bundle
 * Verifies that the library is correctly exposed and usable in a browser environment
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { DOMWindow } from "jsdom"
import { JSDOM } from "jsdom"
import { beforeEach, describe, expect, it, vi } from "vitest"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUNDLE_PATH = path.resolve(__dirname, "../../dist/carte-facile.umd.cjs")

describe("UMD Bundle", () => {
	let window: DOMWindow
	let document: Document

	beforeEach(() => {
		const dom = new JSDOM(
			`
			<!DOCTYPE html>
			<html>
				<body>
					<div id="map"></div>
				</body>
			</html>`,
			{
				runScripts: "dangerously"
			}
		)

		window = dom.window
		document = window.document

		window.maplibregl = {
			Map: vi.fn(),
			NavigationControl: vi.fn(),
			ScaleControl: vi.fn()
		}

		const bundleCode = fs.readFileSync(BUNDLE_PATH, "utf8")
		const script = document.createElement("script")
		script.textContent = bundleCode
		document.body.appendChild(script)
	})

	it("should expose CarteFacile globally", () => {
		expect(window.CarteFacile).toBeDefined()
	})

	it("should expose map styles", () => {
		expect(window.CarteFacile.mapStyle).toBeDefined()
	})

	it("should expose map thumbnails", () => {
		expect(window.CarteFacile.mapThumbnails).toBeDefined()
	})

	it("should expose ZoomLevelControl", () => {
		expect(window.CarteFacile.ZoomLevelControl).toBeDefined()
	})
})

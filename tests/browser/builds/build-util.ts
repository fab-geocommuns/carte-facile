import { expect, it } from "vitest"
import type * as CarteFacile from "../../../src/index"

type API = typeof CarteFacile

type Lib = API | { CarteFacile: API }

export function runTest(getLib: () => Lib) {
	const raw = getLib()
	const lib = "CarteFacile" in raw ? raw.CarteFacile : raw

	it("exposes map styles", () => {
		expect(lib.mapStyles).toBeDefined()
	})

	it("exposes map thumbnails", () => {
		expect(lib.mapThumbnails).toBeDefined()
	})

	it("exposes controls", () => {
		expect(lib.ZoomLevelControl).toBeDefined()
	})
}

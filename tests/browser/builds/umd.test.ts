import { describe } from "vitest"
import { runTest } from "./build-util"

// load bundle into browser
import "../../../dist/carte-facile.umd.cjs"

describe("UMD build", () => {
	runTest(() => window.CarteFacile)
})

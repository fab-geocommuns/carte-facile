import { describe } from "vitest"
import * as CarteFacile from "../../../src/index"
import { runTest } from "./build-util"

describe("ESM build", () => {
	runTest(() => CarteFacile)
})

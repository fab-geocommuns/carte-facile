import type * as CarteFacile from "../src/index"

declare global {
	interface Window {
		CarteFacile: typeof CarteFacile
	}
}

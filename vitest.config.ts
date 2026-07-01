import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		server: {
			deps: {
				inline: ["maplibre-gl"]
			}
		},
		projects: [
			{
				test: {
					include: [
						"tests/unit/**/*.{test,spec}.ts",
						"tests/**/*.unit.{test,spec}.ts"
					],
					name: "unit",
					environment: "node"
				}
			},
			{
				test: {
					include: [
						"tests/browser/**/*.{test,spec}.ts",
						"tests/**/*.browser.{test,spec}.ts"
					],
					name: "browser",
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }]
					}
				}
			}
		]
	}
})

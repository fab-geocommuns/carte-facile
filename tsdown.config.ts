import { defineConfig } from "tsdown"
import image from "@rollup/plugin-image"

export default defineConfig({
	entry: ["./src/index.ts"],
	css: {
		transformer: "postcss",
		minify: true,
	},
	outputOptions: {
		name: "CarteFacile",
		globals: {
			"maplibre-gl": "maplibregl",
		},
	},
	plugins: [
		image({
			include: ["**/*.webp", "**/*.svg"],
			exclude: "node_modules/**",
		}),
	],
})

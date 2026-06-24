import { defineConfig } from "vite"
import { resolve } from "path"
import dts from "unplugin-dts/vite"

export default defineConfig({
	oxc: {
		exclude: [/\.js$/, /\.d\.[cm]?ts$/],
	},
	build: {
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "carte-facile",
			fileName: "carte-facile",
			formats: ["es", "umd"],
		},

		rolldownOptions: {
			external: ["maplibre-gl"],
			output: {
				name: "CarteFacile",
				globals: {
					"maplibre-gl": "maplibregl",
				},
			},
			plugins: [dts()],
		},
	},
})

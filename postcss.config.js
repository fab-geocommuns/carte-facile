import postcssUrl from "postcss-url"

export default () => {
	return {
		plugins: [
			postcssUrl({
				url: "inline", // convertit toutes les urls en base64
				maxSize: 10, // taille max en Ko (10 Ko ici)
				fallback: "copy"
			})
		]
	}
}

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import postcssUrl from 'postcss-url';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/carte-facile.js',
      format: 'umd',
      name: 'CarteFacile',
      sourcemap: true,
      globals: {
        'maplibre-gl': 'maplibregl',
      },
    },
    {
      file: 'dist/carte-facile.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/carte-facile.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    }
  ],
  external: ['maplibre-gl'],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    image({
      include: ['**/*.webp', '**/*.svg'],
      exclude: 'node_modules/**'
    }),
    postcss({
      plugins: [
        postcssUrl({
          url: 'inline', // convertit toutes les urls en base64
          maxSize: 10,   // taille max en Ko (10 Ko ici)
          fallback: 'copy'
        })
      ],
      extract: 'carte-facile.css'
    }),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
}; 
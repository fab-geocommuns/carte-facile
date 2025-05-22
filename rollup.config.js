import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import css from 'rollup-plugin-css-only';

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
    css({
      output: 'carte-facile.css'
    }),
    image({
      include: ['**/*.webp'],
      exclude: 'node_modules/**'
    }),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
}; 
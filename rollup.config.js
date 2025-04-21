import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/cartefacile.js',
      format: 'umd',
      name: 'CarteFacile',
      sourcemap: true,
      globals: {
        'maplibre-gl': 'maplibregl',
      },
    }
  ],
  external: ['maplibre-gl'],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    image({
      include: ['**/*.webp'],
      exclude: 'node_modules/**',
      dom: true,
    }),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
}; 
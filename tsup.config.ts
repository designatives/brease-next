import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM: unbundled, for bundlers (Turbopack, webpack)
  {
    entry: ['src/**/*.{ts,tsx}'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    bundle: false,
    splitting: false,
    treeshake: false,
    outDir: 'dist',
    external: ['react', 'react-dom', 'next'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
  // CJS: bundled, for Node.js runtime (avoids ESM bare-specifier resolution issues)
  {
    entry: ['src/server.ts'],
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    clean: false,
    bundle: true,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'next'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
]);

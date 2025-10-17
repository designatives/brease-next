import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.{ts,tsx}'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  bundle: false,
  splitting: false,
  treeshake: false,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  external: ['react', 'react-dom', 'next'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});

import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM: unbundled, for bundlers (Turbopack, webpack)
  {
    entry: ['src/**/*.{ts,tsx}', '!src/cli.ts'],
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
  // CLI: bundled ESM with shebang. @clack/prompts and giget are bundled in
  // so library consumers don't carry them as runtime deps.
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: false,
    clean: false,
    bundle: true,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    target: 'node18',
    platform: 'node',
    banner: {
      js: "#!/usr/bin/env node\nimport { createRequire as __cliCreateRequire } from 'module';\nconst require = __cliCreateRequire(import.meta.url);",
    },
    external: ['react', 'react-dom', 'next'],
  },
]);

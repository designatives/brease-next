import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const USE_CLIENT_DIRECTIVE = "'use client';\n";

/**
 * Post-build: Add 'use client' directive to client bundles and chunks.
 *
 * This function adds 'use client' to:
 * - client.js / client.cjs (the explicit client entry point)
 * - Any chunk containing createContext or useContext (client-side React code)
 *
 * It does NOT add 'use client' to:
 * - index.js (contains BreaseContext which is an async Server Component)
 * - server.js (server-only utilities)
 * - Chunks that only contain server-side code (api functions, types)
 */
function addUseClientDirectives() {
  const distDir = resolve(process.cwd(), 'dist');
  const files = readdirSync(distDir);

  for (const file of files) {
    // Only process .js and .cjs files
    if (!file.endsWith('.js') && !file.endsWith('.cjs')) continue;
    if (file.endsWith('.d.ts') || file.endsWith('.d.cts')) continue;

    const filePath = join(distDir, file);
    try {
      const content = readFileSync(filePath, 'utf-8');

      // Skip if already has 'use client'
      if (content.startsWith("'use client'")) continue;

      // Determine if this file needs 'use client':
      // 1. client.* entry points always need it
      // 2. Chunks containing React context code need it
      const isClientEntry = file.startsWith('client.');
      const isClientChunk =
        file.startsWith('chunk-') &&
        (content.includes('createContext') || content.includes('useContext'));

      // Never add to index.* or server.* - they contain async Server Components
      const isServerEntry = file.startsWith('index.') || file.startsWith('server.');

      if ((isClientEntry || isClientChunk) && !isServerEntry) {
        writeFileSync(filePath, USE_CLIENT_DIRECTIVE + content);
        console.log(`✓ Added 'use client' to ${file}`);
      }
    } catch {
      // Skip files that can't be read
    }
  }
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  // Enable splitting to create separate chunks for shared code
  splitting: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  external: ['react', 'react-dom', 'next'],
  metafile: true,
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  onSuccess: async () => {
    addUseClientDirectives();
    console.log('\n📦 Build complete with proper server/client separation');
  },
});

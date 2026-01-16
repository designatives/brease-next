import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const USE_CLIENT_DIRECTIVE = "'use client';\n";

// Post-build: prepend 'use client' to all files containing createContext
function addUseClientDirectives() {
  const distDir = resolve(process.cwd(), 'dist');
  const files = readdirSync(distDir);

  for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.cjs')) continue;
    if (file.endsWith('.d.ts') || file.endsWith('.d.cts')) continue;

    const filePath = join(distDir, file);
    try {
      const content = readFileSync(filePath, 'utf-8');

      // Add 'use client' to files that use createContext or useContext
      const needsUseClient =
        content.includes('createContext') || content.includes('useContext');

      if (needsUseClient && !content.startsWith("'use client'")) {
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
    server: 'src/server.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
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
  },
});

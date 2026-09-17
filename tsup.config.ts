import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { main: 'electron/main.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node24',
    outDir: 'dist-electron',
    external: ['electron', 'node:sqlite'],
    clean: true,
  },
  {
    entry: { preload: 'electron/preload.cts' },
    format: ['cjs'],
    platform: 'node',
    target: 'node24',
    outDir: 'dist-electron',
    external: ['electron'],
    outExtension: () => ({ js: '.cjs' }),
    clean: false,
  },
]);

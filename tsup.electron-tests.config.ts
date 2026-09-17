import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'backend.test': 'electron/tests/backend.test.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist-electron-tests',
  external: ['node:sqlite'],
  clean: true,
});

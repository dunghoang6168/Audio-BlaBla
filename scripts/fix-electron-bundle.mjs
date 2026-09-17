import { readFile, writeFile } from 'node:fs/promises';

const mainPath = process.argv[2]
  ? new URL(`../${process.argv[2].replaceAll('\\', '/')}`, import.meta.url)
  : new URL('../dist-electron/main.js', import.meta.url);
const source = await readFile(mainPath, 'utf8');
const corrected = source
  .replaceAll('from "sqlite"', 'from "node:sqlite"')
  .replaceAll('import("sqlite")', 'import("node:sqlite")')
  .replaceAll('from "test"', 'from "node:test"');
if (corrected === source) throw new Error('Expected sqlite import was not found in Electron bundle');
await writeFile(mainPath, corrected, 'utf8');

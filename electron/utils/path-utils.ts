import { createHash } from 'node:crypto';
import path from 'node:path';
import { realpath } from 'node:fs/promises';

export function pathKey(value: string): string {
  const normalized = path.normalize(path.resolve(value));
  return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized;
}

export async function canonicalPath(value: string): Promise<string> {
  return path.normalize(await realpath(path.resolve(value)));
}

export function stableId(prefix: string, value: string): string {
  return `${prefix}-${createHash('sha256').update(value).digest('hex')}`;
}

export function isPathInside(candidate: string, root: string): boolean {
  const relative = path.relative(pathKey(root), pathKey(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function pathsOverlap(left: string, right: string): boolean {
  return isPathInside(left, right) || isPathInside(right, left);
}

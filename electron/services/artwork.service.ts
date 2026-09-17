import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IPicture } from 'music-metadata';
import { DatabaseService } from './database.service.js';

const MAX_ARTWORK_BYTES = 10 * 1024 * 1024;
const FORMATS: Record<string, { extension: string; mime: string }> = {
  'image/jpeg': { extension: 'jpg', mime: 'image/jpeg' },
  'image/jpg': { extension: 'jpg', mime: 'image/jpeg' },
  'image/png': { extension: 'png', mime: 'image/png' },
  'image/webp': { extension: 'webp', mime: 'image/webp' },
};

export class ArtworkService {
  constructor(private readonly cachePath: string, private readonly database: DatabaseService) {}

  async save(picture: IPicture | undefined): Promise<string | null> {
    if (!picture || picture.data.byteLength > MAX_ARTWORK_BYTES) return null;
    const format = FORMATS[picture.format.toLowerCase()];
    if (!format) return null;
    const hash = createHash('sha256').update(picture.data).digest('hex');
    const artworkPath = path.join(this.cachePath, `${hash}.${format.extension}`);
    await mkdir(this.cachePath, { recursive: true });
    try { await writeFile(artworkPath, picture.data, { flag: 'wx' }); } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
    }
    this.database.saveArtwork(hash, artworkPath, format.mime, picture.data.byteLength);
    return hash;
  }
}

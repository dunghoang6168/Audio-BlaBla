import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IPicture } from 'music-metadata';
import { DatabaseService } from './database.service.js';

const MAX_ARTWORK_BYTES = 20 * 1024 * 1024;
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
    return this.saveBuffer(picture.data, picture.format, MAX_ARTWORK_BYTES);
  }

  async saveFolderCover(filePath: string): Promise<string | null> {
    const extension = path.extname(filePath).toLowerCase();
    const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg'
      : extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : null;
    if (!mime) return null;
    const info = await stat(filePath);
    if (info.size === 0 || info.size > MAX_ARTWORK_BYTES) return null;
    const bytes = await readFile(filePath);
    if (!matchesFormat(bytes, mime)) return null;
    return this.saveBuffer(bytes, mime, MAX_ARTWORK_BYTES);
  }

  async saveBuffer(data: Uint8Array, mime: string, maxBytes = 8 * 1024 * 1024): Promise<string | null> {
    if (data.byteLength > maxBytes) return null;
    const format = FORMATS[mime.toLowerCase().split(';', 1)[0]];
    if (!format) return null;
    const hash = createHash('sha256').update(data).digest('hex');
    const artworkPath = path.join(this.cachePath, `${hash}.${format.extension}`);
    await mkdir(this.cachePath, { recursive: true });
    try { await writeFile(artworkPath, data, { flag: 'wx' }); } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
    }
    this.database.saveArtwork(hash, artworkPath, format.mime, data.byteLength);
    return hash;
  }
}

function matchesFormat(data: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mime === 'image/png') return data.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => data[index] === byte);
  return data.length >= 12 && Buffer.from(data.subarray(0, 4)).toString() === 'RIFF' && Buffer.from(data.subarray(8, 12)).toString() === 'WEBP';
}

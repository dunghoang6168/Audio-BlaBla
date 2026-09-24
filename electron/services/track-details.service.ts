import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseFile, type IAudioMetadata } from 'music-metadata';
import type { TrackDetails } from '../../src/app/core/models/index.js';
import { isPathInside } from '../utils/path-utils.js';
import { log } from '../utils/logger.js';
import { DatabaseService } from './database.service.js';

interface TrackFileInfo {
  fileName: string;
  path: string;
  fileSize: number;
  lastModified: number;
}

export class TrackDetailsService {
  constructor(private readonly database: DatabaseService) {}

  async get(trackId: string): Promise<TrackDetails> {
    const stored = this.database.resolveTrack(trackId);
    if (!stored) throw new Error('Track not found or unavailable');

    let canonical: string;
    let fileStat;
    try {
      canonical = await realpath(stored.path);
      fileStat = await stat(canonical);
    } catch {
      throw new Error('Audio file is unavailable');
    }

    if (!fileStat.isFile()) throw new Error('Audio file is unavailable');
    if (!this.database.listFolders().some((folder) => isPathInside(canonical, folder.path))) {
      throw new Error('Track is outside registered music folders');
    }

    try {
      const metadata = await parseFile(canonical, { duration: true, skipCovers: true });
      return mapTrackDetails(trackId, metadata, {
        fileName: path.basename(canonical),
        path: canonical,
        fileSize: fileStat.size,
        lastModified: fileStat.mtimeMs,
      });
    } catch (error) {
      log('warn', 'metadata', `Could not read detailed metadata for ${path.basename(canonical)}`, error);
      throw new Error('Could not read track metadata');
    }
  }
}

export function mapTrackDetails(trackId: string, metadata: IAudioMetadata, file: TrackFileInfo): TrackDetails {
  const common = metadata.common;
  const format = metadata.format;
  return {
    trackId,
    metadata: {
      title: cleanString(common.title),
      artists: cleanList(common.artists?.length ? common.artists : common.artist ? [common.artist] : []),
      album: cleanString(common.album),
      albumArtists: cleanList(common.albumartists?.length ? common.albumartists : common.albumartist ? [common.albumartist] : []),
      date: cleanString(common.date ?? common.releasedate),
      year: finiteNumber(common.year),
      composers: cleanList(common.composer),
      genres: cleanList(common.genre),
      trackNumber: finiteNumber(common.track.no),
      totalTracks: finiteNumber(common.track.of),
      discNumber: finiteNumber(common.disk.no),
      totalDiscs: finiteNumber(common.disk.of),
    },
    audio: {
      duration: finiteNumber(format.duration),
      numberOfSamples: finiteNumber(format.numberOfSamples),
      sampleRate: finiteNumber(format.sampleRate),
      channels: finiteNumber(format.numberOfChannels),
      bitsPerSample: finiteNumber(format.bitsPerSample),
      bitrate: finiteNumber(format.bitrate),
      codec: cleanString(format.codec),
      codecProfile: cleanString(format.codecProfile),
      container: cleanString(format.container),
      lossless: typeof format.lossless === 'boolean' ? format.lossless : null,
      encoderTool: cleanString(format.tool),
      tagTypes: cleanList(format.tagTypes),
      audioMd5: format.audioMD5?.length ? Buffer.from(format.audioMD5).toString('hex').toUpperCase() : null,
    },
    file: {
      fileName: file.fileName,
      path: file.path,
      fileSize: finiteNumber(file.fileSize),
      lastModified: finiteNumber(file.lastModified),
    },
  };
}

function cleanString(value: string | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned || null;
}

function cleanList(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function finiteNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

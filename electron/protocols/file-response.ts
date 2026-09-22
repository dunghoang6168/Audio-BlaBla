import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

interface ByteRange {
  start: number;
  end: number;
}

export async function createFileResponse(filePath: string, request: Request, mime: string | null, allowedOrigin?: string): Promise<Response> {
  let fileSize: number;
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return textResponse(404, 'File not found');
    fileSize = fileStat.size;
  } catch {
    return textResponse(404, 'File not found');
  }

  const headers = new Headers({
    'accept-ranges': 'bytes',
    'content-type': mime || 'application/octet-stream',
  });
  if (allowedOrigin) {
    headers.set('access-control-allow-origin', allowedOrigin);
    headers.set('vary', 'Origin');
  }
  const rangeHeader = request.headers.get('range');
  const range = rangeHeader ? parseByteRange(rangeHeader, fileSize) : null;

  if (rangeHeader && !range) {
    headers.set('content-range', `bytes */${fileSize}`);
    return new Response(null, { status: 416, headers });
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? Math.max(0, fileSize - 1);
  const contentLength = fileSize === 0 ? 0 : end - start + 1;
  headers.set('content-length', String(contentLength));
  if (range) headers.set('content-range', `bytes ${start}-${end}/${fileSize}`);

  const status = range ? 206 : 200;
  if (request.method === 'HEAD' || fileSize === 0) return new Response(null, { status, headers });

  const stream = createReadStream(filePath, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status, headers });
}

function parseByteRange(value: string, fileSize: number): ByteRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || fileSize <= 0 || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, fileSize - suffixLength), end: fileSize - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start < 0 || start >= fileSize || requestedEnd < start) return null;
  return { start, end: Math.min(requestedEnd, fileSize - 1) };
}

function textResponse(status: number, message: string): Response {
  return new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

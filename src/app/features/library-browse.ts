import { Album } from '../core/models';

const nameCollator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

export function compareNames(a: string, b: string): number {
  return nameCollator.compare(a, b);
}

export function compareAlbumsByTitle(a: Album, b: Album): number {
  return compareNames(a.title, b.title) || compareNames(a.id, b.id);
}

export function artistInitial(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  const letter = first.replace('Đ', 'D').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /^[A-Z]$/.test(letter) ? letter : '#';
}

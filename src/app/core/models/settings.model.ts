import { MusicFolder } from './folder.model';

export type RepeatMode = 'off' | 'one' | 'all';

export const DARK_THEME_PRESETS = [
  'midnight',
  'graphite',
  'ocean',
  'forest',
] as const;

export const LIGHT_THEME_PRESETS = [
  'porcelain',
  'cloud',
  'sky',
  'sage',
] as const;

export const THEME_PRESETS = [...DARK_THEME_PRESETS, ...LIGHT_THEME_PRESETS] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export const ACCENT_COLORS = ['violet', 'blue', 'cyan', 'emerald', 'amber', 'rose'] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export const DEFAULT_THEME_PRESET: ThemePreset = 'midnight';
export const DEFAULT_ACCENT_COLOR: AccentColor = 'violet';

export function isThemePreset(value: unknown): value is ThemePreset {
  return typeof value === 'string' && (THEME_PRESETS as readonly string[]).includes(value);
}

export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === 'string' && (ACCENT_COLORS as readonly string[]).includes(value);
}

export interface Settings {
  musicFolders: MusicFolder[];
  defaultVolume: number; // 0.0 to 1.0
  repeatMode: RepeatMode;
  shuffle: boolean;
  themePreset: ThemePreset;
  accentColor: AccentColor;
}

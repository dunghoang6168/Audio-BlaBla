import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY, SETTINGS_GATEWAY } from '../../core/contracts';
import { AccentColor, MusicFolder, RepeatMode, Settings, ThemePreset } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { ThemeService } from '../../core/theme/theme.service';
import { getDesktopApi } from '../../core/desktop/desktop-api';
import { IconComponent } from '../../shared/components/icon/icon.component';

export interface ThemePresetOption {
  id: ThemePreset;
  label: string;
  description: string;
  canvas: string;
  sidebar: string;
  surface: string;
  border: string;
  text: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  private readonly settingsGateway = inject(SETTINGS_GATEWAY);
  readonly themeService = inject(ThemeService);
  readonly player = inject(PlayerService);
  readonly isDesktop = Boolean(getDesktopApi());

  readonly darkThemePresets: ThemePresetOption[] = [
    {
      id: 'midnight',
      label: 'Midnight',
      description: 'Deep slate canvas with subtle dark violet undertones',
      canvas: '#0b0f19',
      sidebar: '#070a12',
      surface: '#121826',
      border: '#26334d',
      text: '#f1f5f9',
    },
    {
      id: 'graphite',
      label: 'Graphite',
      description: 'Monochromatic slate & charcoal deep tones',
      canvas: '#121417',
      sidebar: '#0b0d0f',
      surface: '#1a1d22',
      border: '#2e343d',
      text: '#f0f2f5',
    },
    {
      id: 'ocean',
      label: 'Ocean',
      description: 'Abyssal navy & marine night ambience',
      canvas: '#08131d',
      sidebar: '#040a10',
      surface: '#0d1e2d',
      border: '#1d374e',
      text: '#ecf4fb',
    },
    {
      id: 'forest',
      label: 'Forest',
      description: 'Deep pine & emerald shadow tones',
      canvas: '#081410',
      sidebar: '#040b08',
      surface: '#0d1e18',
      border: '#1d3b30',
      text: '#ecf7f1',
    },
  ];

  readonly lightThemePresets: ThemePresetOption[] = [
    {
      id: 'porcelain',
      label: 'Porcelain',
      description: 'Clean, high-contrast studio white canvas',
      canvas: '#ffffff',
      sidebar: '#f8fafc',
      surface: '#f1f5f9',
      border: '#cbd5e1',
      text: '#0f172a',
    },
    {
      id: 'cloud',
      label: 'Cloud',
      description: 'Soft mist & silvery neutral surfaces',
      canvas: '#f8fafc',
      sidebar: '#f1f5f9',
      surface: '#ffffff',
      border: '#cbd5e1',
      text: '#1e293b',
    },
    {
      id: 'sky',
      label: 'Sky',
      description: 'Cool atmospheric light blue breeze',
      canvas: '#f0f7ff',
      sidebar: '#e2efff',
      surface: '#ffffff',
      border: '#bcd6f4',
      text: '#0c2744',
    },
    {
      id: 'sage',
      label: 'Sage',
      description: 'Soft organic herbal & tea leaf tint',
      canvas: '#f2f7f4',
      sidebar: '#e4efe8',
      surface: '#ffffff',
      border: '#bed6c6',
      text: '#0e2b1b',
    },
  ];

  get themePresets(): ThemePresetOption[] {
    return [...this.darkThemePresets, ...this.lightThemePresets];
  }

  readonly accentColors: { id: AccentColor; label: string; hex: string }[] = [
    { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
    { id: 'blue', label: 'Blue', hex: '#3b82f6' },
    { id: 'cyan', label: 'Cyan', hex: '#06b6d4' },
    { id: 'emerald', label: 'Emerald', hex: '#10b981' },
    { id: 'amber', label: 'Amber', hex: '#f59e0b' },
    { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  ];

  readonly folders = signal<MusicFolder[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadFolders(),
      this.loadSettings(),
    ]);
  }

  async loadSettings(): Promise<void> {
    try {
      const s = await this.settingsGateway.getSettings();
      if (s) {
        if (typeof s.defaultVolume === 'number') {
          this.player.setVolume(s.defaultVolume);
        }
        if (s.repeatMode) {
          this.player.setRepeatMode(s.repeatMode);
        }
        if (typeof s.shuffle === 'boolean') {
          this.player.setShuffle(s.shuffle);
        }
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load settings');
    }
  }

  async loadFolders(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.folders.set(lib.folders);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load library folders');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onAddFolder(): Promise<void> {
    this.errorMessage.set(null);
    try {
      const selected = await this.libraryGateway.selectAndAddMusicFolders();
      if (selected && selected.length > 0) {
        await this.loadFolders();
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to select or add folder');
    }
  }

  async onRemoveFolder(folderId: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.libraryGateway.removeMusicFolder(folderId);
      await this.loadFolders();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to remove folder');
    }
  }

  async onRescanLibrary(): Promise<void> {
    try {
      await this.libraryGateway.requestScan();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to request scan');
    }
  }

  async onVolumeChange(val: number): Promise<void> {
    this.player.setVolume(val);
    try {
      await this.settingsGateway.saveSettings({ defaultVolume: val });
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to save volume preference');
    }
  }

  async onRepeatChange(mode: RepeatMode): Promise<void> {
    this.player.setRepeatMode(mode);
    try {
      await this.settingsGateway.saveSettings({ repeatMode: mode });
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to save repeat preference');
    }
  }
}

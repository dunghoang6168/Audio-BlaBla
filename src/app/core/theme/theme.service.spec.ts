import { TestBed } from '@angular/core/testing';
import { SETTINGS_GATEWAY, SettingsGateway } from '../contracts';
import { Settings, ThemePreset } from '../models';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let gateway: SettingsGatewayStub;
  let service: ThemeService;

  beforeEach(() => {
    gateway = new SettingsGatewayStub();
    TestBed.configureTestingModule({ providers: [{ provide: SETTINGS_GATEWAY, useValue: gateway }] });
    service = TestBed.inject(ThemeService);
    TestBed.tick();
  });

  it('restores the saved theme and accent on the document root', async () => {
    gateway.settings.themePreset = 'sky';
    gateway.settings.accentColor = 'cyan';

    await service.restore();
    TestBed.tick();

    expect(service.themePreset()).toBe('sky');
    expect(service.accentColor()).toBe('cyan');
    expect(document.documentElement.dataset['theme']).toBe('sky');
    expect(document.documentElement.dataset['accent']).toBe('cyan');
    expect(service.saveState()).toBe('idle');
  });

  it('falls back to midnight and violet for missing legacy values', async () => {
    gateway.settings = { ...gateway.settings, themePreset: undefined, accentColor: undefined } as unknown as Settings;

    await service.restore();
    TestBed.tick();

    expect(service.themePreset()).toBe('midnight');
    expect(service.accentColor()).toBe('violet');
  });

  it('applies and persists theme changes', async () => {
    await service.setThemePreset('sage');
    await service.setAccentColor('amber');
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('sage');
    expect(document.documentElement.dataset['accent']).toBe('amber');
    expect(gateway.settings.themePreset).toBe('sage');
    expect(gateway.settings.accentColor).toBe('amber');
    expect(service.saveState()).toBe('saved');
    expect(service.errorMessage()).toBeNull();
  });

  it('persists rapid theme changes in order', async () => {
    const themeSave = service.setThemePreset('forest');
    const accentSave = service.setAccentColor('rose');

    await Promise.all([themeSave, accentSave]);
    TestBed.tick();

    expect(gateway.savedValues).toEqual([
      { themePreset: 'forest', accentColor: 'violet' },
      { themePreset: 'forest', accentColor: 'rose' },
    ]);
    expect(service.saveState()).toBe('saved');
  });

  it('rolls back the latest selection when persistence fails', async () => {
    gateway.settings.themePreset = 'ocean';
    gateway.settings.accentColor = 'cyan';
    await service.restore();
    gateway.saveError = new Error('Settings storage is unavailable');

    await service.setThemePreset('porcelain');
    TestBed.tick();

    expect(service.themePreset()).toBe('ocean');
    expect(service.accentColor()).toBe('cyan');
    expect(document.documentElement.dataset['theme']).toBe('ocean');
    expect(service.saveState()).toBe('error');
    expect(service.errorMessage()).toBe('Settings storage is unavailable');
  });

  it('applies the semantic canvas and color scheme for every preset', async () => {
    const palettes: Record<ThemePreset, { canvas: string; colorScheme: 'dark' | 'light' }> = {
      midnight: { canvas: '#0d0f17', colorScheme: 'dark' },
      graphite: { canvas: '#111214', colorScheme: 'dark' },
      ocean: { canvas: '#07131c', colorScheme: 'dark' },
      forest: { canvas: '#09130f', colorScheme: 'dark' },
      porcelain: { canvas: '#f8f9fa', colorScheme: 'light' },
      cloud: { canvas: '#f1f4f8', colorScheme: 'light' },
      sky: { canvas: '#f0f7ff', colorScheme: 'light' },
      sage: { canvas: '#f2f6f3', colorScheme: 'light' },
    };

    for (const [themePreset, expected] of Object.entries(palettes) as Array<[ThemePreset, typeof palettes[ThemePreset]]>) {
      await service.setThemePreset(themePreset);
      TestBed.tick();

      const root = document.documentElement;
      const styles = getComputedStyle(root);
      expect(root.dataset['theme']).toBe(themePreset);
      expect(root.style.colorScheme).toBe(expected.colorScheme);
      expect(styles.getPropertyValue('--color-canvas').trim().toLowerCase()).toBe(expected.canvas);
    }
  });
});

class SettingsGatewayStub implements SettingsGateway {
  saveError: Error | null = null;
  savedValues: Partial<Settings>[] = [];
  settings: Settings = {
    musicFolders: [],
    defaultVolume: 0.8,
    repeatMode: 'off',
    shuffle: false,
    themePreset: 'midnight',
    accentColor: 'violet',
  };

  async getSettings(): Promise<Settings> {
    return { ...this.settings };
  }

  async saveSettings(settings: Partial<Settings>): Promise<Settings> {
    if (this.saveError) throw this.saveError;
    this.savedValues.push({ ...settings });
    this.settings = { ...this.settings, ...settings };
    return { ...this.settings };
  }
}

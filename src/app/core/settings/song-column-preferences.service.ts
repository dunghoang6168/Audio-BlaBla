import { Injectable, inject, signal } from '@angular/core';
import { SETTINGS_GATEWAY } from '../contracts';
import { normalizeHiddenSongColumns, SongColumn } from '../models';

@Injectable({ providedIn: 'root' })
export class SongColumnPreferencesService {
  private readonly settingsGateway = inject(SETTINGS_GATEWAY);
  readonly hiddenSongColumns = signal<SongColumn[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  private loadPromise: Promise<void> | null = null;
  private saveQueue = Promise.resolve();
  private lastSavedColumns: SongColumn[] = [];

  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = (async () => {
      try {
        const settings = await this.settingsGateway.getSettings();
        const hidden = normalizeHiddenSongColumns(settings.hiddenSongColumns);
        this.hiddenSongColumns.set(hidden);
        this.lastSavedColumns = hidden;
      } catch (error: any) {
        this.errorMessage.set(error?.message || 'Failed to load Songs column preferences');
      } finally {
        this.isLoading.set(false);
      }
    })();
    return this.loadPromise;
  }

  isHidden(column: SongColumn): boolean {
    return this.hiddenSongColumns().includes(column);
  }

  async setVisible(column: SongColumn, visible: boolean): Promise<void> {
    if (this.isLoading()) await this.load();
    const previous = this.hiddenSongColumns();
    const next = visible ? previous.filter((item) => item !== column)
      : [...new Set([...previous, column])];
    if (next.length === previous.length && next.every((item, index) => item === previous[index])) return;
    this.hiddenSongColumns.set(next);
    this.errorMessage.set(null);
    const save = this.saveQueue.then(() => this.settingsGateway.saveSettings({ hiddenSongColumns: next }));
    this.saveQueue = save.then(() => undefined, () => undefined);
    try {
      await save;
      this.lastSavedColumns = next;
    } catch (error: any) {
      if (this.hiddenSongColumns() === next) this.hiddenSongColumns.set(this.lastSavedColumns);
      this.errorMessage.set(error?.message || 'Failed to save Songs column preferences');
    }
  }
}

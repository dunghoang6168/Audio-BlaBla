import { InjectionToken } from '@angular/core';
import { Settings } from '../models';

export interface SettingsGateway {
  getSettings(): Promise<Settings>;
  saveSettings(settings: Partial<Settings>): Promise<Settings>;
}

export const SETTINGS_GATEWAY = new InjectionToken<SettingsGateway>('SETTINGS_GATEWAY');

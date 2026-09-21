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
  template: `
    <div class="settings-page">
      <header class="settings-header">
        <h1>Settings</h1>
        <p class="subtitle">Configure appearance, library folders, playback preferences, and review integration state</p>
      </header>

      @if (errorMessage()) {
        <div class="error-notice-card" role="alert">
          <div class="notice-icon error">
            <app-icon name="alert-triangle" [size]="18" />
          </div>
          <div class="notice-content">
            <h3>Settings Error</h3>
            <p>{{ errorMessage() }}</p>
          </div>
          <button type="button" class="btn-dismiss-err" (click)="errorMessage.set(null)" aria-label="Dismiss error">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }

      <!-- Runtime / Persistence Notice -->
      <div class="integration-notice-card">
        <div class="notice-icon">
          <app-icon [name]="isDesktop ? 'sparkles' : 'info'" [size]="18" />
        </div>
        <div class="notice-content">
          @if (isDesktop) {
            <h3>Electron Desktop Environment</h3>
            <p>
              Music folders, library metadata, playlists and playback settings are persisted locally with SQLite.
              Audio playback and folder scanning use the desktop integration completed in <strong>Phase 2</strong>.
            </p>
          } @else {
            <h3>Mock Environment (Browser Mode)</h3>
            <p>
              Settings, folder modifications and playlists are preserved in-memory across route navigation.
              Reloading the browser resets them to fixture defaults; native filesystem access is only available in Electron.
            </p>
          }
        </div>
      </div>

      <div class="settings-sections">
        <!-- Section 0: Appearance & Theme -->
        <section class="settings-card appearance-card">
          <div class="card-header appearance-header">
            <div>
              <h2>Appearance & Theme</h2>
              <span class="card-desc">Personalize your desktop experience with curated dark/light palettes and accent tones</span>
            </div>
            <!-- Theme Save State Feedback -->
            <div class="theme-status-indicator" [attr.aria-live]="'polite'">
              @if (themeService.saveState() === 'saving') {
                <span class="theme-save-badge saving">
                  <span class="spinner-dot"></span>
                  Saving…
                </span>
              } @else if (themeService.saveState() === 'saved') {
                <span class="theme-save-badge saved">
                  <app-icon name="check" [size]="14" />
                  Saved
                </span>
              }
            </div>
          </div>

          @if (themeService.saveState() === 'error') {
            <div class="theme-error-banner" role="alert">
              <app-icon name="alert-triangle" [size]="16" />
              <span>{{ themeService.errorMessage() || 'Failed to persist theme settings.' }}</span>
            </div>
          }

          <div class="appearance-sections">
            <!-- Dark Themes Group -->
            <div class="theme-group">
              <div class="theme-group-header">
                <span class="group-icon dark-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </span>
                <span class="group-title">Dark Themes</span>
                <span class="group-tag">Deep tones</span>
              </div>

              <div class="preset-cards-grid" role="radiogroup" aria-label="Dark Theme Presets">
                @for (preset of darkThemePresets; track preset.id) {
                  <div
                    class="preset-card"
                    [class.active]="themeService.themePreset() === preset.id"
                    role="radio"
                    tabindex="0"
                    [attr.aria-checked]="themeService.themePreset() === preset.id"
                    (click)="themeService.setThemePreset(preset.id)"
                    (keydown.enter)="themeService.setThemePreset(preset.id)"
                    (keydown.space)="$event.preventDefault(); themeService.setThemePreset(preset.id)">

                    <div class="swatch-preview" [style.--p-canvas]="preset.canvas" [style.--p-sidebar]="preset.sidebar" [style.--p-surface]="preset.surface" [style.--p-border]="preset.border" [style.--p-text]="preset.text">
                      <div class="swatch-sidebar">
                        <div class="swatch-bar"></div>
                        <div class="swatch-bar short"></div>
                        <div class="swatch-bar"></div>
                      </div>
                      <div class="swatch-main">
                        <div class="swatch-header"></div>
                        <div class="swatch-content">
                          <div class="swatch-surface">
                            <div class="swatch-line"></div>
                            <div class="swatch-line short"></div>
                          </div>
                        </div>
                      </div>
                      @if (themeService.themePreset() === preset.id) {
                        <div class="selected-indicator" aria-hidden="true">
                          <app-icon name="check" [size]="12" />
                        </div>
                      }
                    </div>

                    <div class="preset-info">
                      <div class="preset-title-row">
                        <span class="preset-name">{{ preset.label }}</span>
                      </div>
                      <span class="preset-desc">{{ preset.description }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Light Themes Group -->
            <div class="theme-group">
              <div class="theme-group-header">
                <span class="group-icon light-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </span>
                <span class="group-title">Light Themes</span>
                <span class="group-tag">Crisp tones</span>
              </div>

              <div class="preset-cards-grid" role="radiogroup" aria-label="Light Theme Presets">
                @for (preset of lightThemePresets; track preset.id) {
                  <div
                    class="preset-card"
                    [class.active]="themeService.themePreset() === preset.id"
                    role="radio"
                    tabindex="0"
                    [attr.aria-checked]="themeService.themePreset() === preset.id"
                    (click)="themeService.setThemePreset(preset.id)"
                    (keydown.enter)="themeService.setThemePreset(preset.id)"
                    (keydown.space)="$event.preventDefault(); themeService.setThemePreset(preset.id)">

                    <div class="swatch-preview" [style.--p-canvas]="preset.canvas" [style.--p-sidebar]="preset.sidebar" [style.--p-surface]="preset.surface" [style.--p-border]="preset.border" [style.--p-text]="preset.text">
                      <div class="swatch-sidebar">
                        <div class="swatch-bar"></div>
                        <div class="swatch-bar short"></div>
                        <div class="swatch-bar"></div>
                      </div>
                      <div class="swatch-main">
                        <div class="swatch-header"></div>
                        <div class="swatch-content">
                          <div class="swatch-surface">
                            <div class="swatch-line"></div>
                            <div class="swatch-line short"></div>
                          </div>
                        </div>
                      </div>
                      @if (themeService.themePreset() === preset.id) {
                        <div class="selected-indicator" aria-hidden="true">
                          <app-icon name="check" [size]="12" />
                        </div>
                      }
                    </div>

                    <div class="preset-info">
                      <div class="preset-title-row">
                        <span class="preset-name">{{ preset.label }}</span>
                      </div>
                      <span class="preset-desc">{{ preset.description }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Accent Color Picker -->
            <div class="accent-picker-section">
              <div class="theme-group-header">
                <span class="group-icon accent-icon" aria-hidden="true">
                  <app-icon name="sparkles" [size]="15" />
                </span>
                <span class="group-title">Accent Color</span>
                <span class="group-desc-inline">Active items, sliders, buttons, and focus rings</span>
              </div>

              <div class="accent-palette-row" role="radiogroup" aria-label="Accent Color">
                @for (color of accentColors; track color.id) {
                  <button
                    type="button"
                    class="accent-option-btn"
                    [class.active]="themeService.accentColor() === color.id"
                    [style.--accent-swatch]="color.hex"
                    role="radio"
                    [attr.aria-checked]="themeService.accentColor() === color.id"
                    (click)="themeService.setAccentColor(color.id)"
                    [title]="color.label"
                    [attr.aria-label]="color.label + ' accent color'">
                    <span class="accent-circle">
                      @if (themeService.accentColor() === color.id) {
                        <app-icon name="check" [size]="13" />
                      }
                    </span>
                    <span class="accent-label">{{ color.label }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </section>

        <!-- Section 1: Music Folders & Library Management -->
        <section class="settings-card">
          <div class="card-header">
            <h2>Music Library Folders</h2>
            <span class="card-desc">Directories scanned for audio files and metadata</span>
          </div>

          <div class="folders-list">
            @for (folder of folders(); track folder.id) {
              <div class="folder-row">
                <div class="folder-info">
                  <span class="folder-name">{{ folder.name }}</span>
                  <span class="folder-path truncate" [title]="folder.path">{{ folder.path }}</span>
                </div>
                <button
                  type="button"
                  class="btn-remove-folder"
                  (click)="onRemoveFolder(folder.id)"
                  title="Remove folder from library">
                  Remove
                </button>
              </div>
            }
          </div>

          <div class="folder-actions">
            <button type="button" class="btn-primary" (click)="onAddFolder()">
              + Add Music Folder
            </button>
            <button type="button" class="btn-secondary" (click)="onRescanLibrary()">
              Rescan All Folders
            </button>
          </div>
        </section>

        <!-- Section 2: Audio Playback Preferences -->
        <section class="settings-card">
          <div class="card-header">
            <h2>Playback Preferences</h2>
            <span class="card-desc">Default behavior for audio controls</span>
          </div>

          <div class="pref-rows">
            <!-- Default Volume -->
            <div class="pref-row">
              <div class="pref-label">
                <span class="pref-title">Default Volume</span>
                <span class="pref-desc">Audio volume when starting the player</span>
              </div>
              <div class="pref-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  [ngModel]="player.volume()"
                  (ngModelChange)="onVolumeChange($event)"
                  class="volume-slider" />
                <span class="pref-val">{{ (player.volume() * 100) | number:'1.0-0' }}%</span>
              </div>
            </div>

            <!-- Repeat Mode Default -->
            <div class="pref-row">
              <div class="pref-label">
                <span class="pref-title">Repeat Mode</span>
                <span class="pref-desc">Queue looping behavior upon track completion</span>
              </div>
              <div class="pref-control">
                <select [ngModel]="player.repeatMode()" (ngModelChange)="onRepeatChange($event)" class="select-box">
                  <option value="off">Off (Stop at end of queue)</option>
                  <option value="all">Repeat All (Cycle entire queue)</option>
                  <option value="one">Repeat One (Loop single track)</option>
                </select>
              </div>
            </div>

            <!-- Shuffle Default -->
            <div class="pref-row">
              <div class="pref-label">
                <span class="pref-title">Shuffle Mode</span>
                <span class="pref-desc">Randomize track playback order</span>
              </div>
              <div class="pref-control">
                <button
                  type="button"
                  class="btn-toggle"
                  [class.active]="player.isShuffle()"
                  (click)="player.toggleShuffle()">
                  {{ player.isShuffle() ? 'Shuffle ON' : 'Shuffle OFF' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: About & Architecture -->
        <section class="settings-card">
          <div class="card-header">
            <h2>About Audio BlaBla</h2>
            <span class="card-desc">Technical specification & build info</span>
          </div>

          <div class="about-grid">
            <div class="about-item">
              <span class="about-label">Frontend Framework</span>
              <span class="about-value">Angular 21 (Standalone, Signals)</span>
            </div>
            <div class="about-item">
              <span class="about-label">Language</span>
              <span class="about-value">TypeScript 5.9 (Strict Mode)</span>
            </div>
            <div class="about-item">
              <span class="about-label">Styles & Icons</span>
              <span class="about-value">SCSS, CSS Variables, Native SVG Icons</span>
            </div>
            <div class="about-item">
              <span class="about-label">State Management</span>
              <span class="about-value">Angular Signals & Computed (No NgRx)</span>
            </div>
            <div class="about-item">
              <span class="about-label">Integration Phase</span>
              <span class="about-value">
                {{ isDesktop ? 'Phase 2 Complete (Electron Desktop)' : 'Browser Mode (Mock Adapters)' }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      padding: var(--space-8);
      height: 100%;
      overflow-y: auto;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .settings-header h1 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
    }

    .subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    /* Error notice */
    .error-notice-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--status-error);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      position: relative;
    }

    .notice-icon.error {
      background: var(--status-error);
    }

    .error-notice-card .notice-content h3 {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--status-error);
      margin-bottom: var(--space-1);
    }

    .btn-dismiss-err {
      margin-left: auto;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: var(--font-size-lg);
      cursor: pointer;
      line-height: 1;
    }

    .btn-dismiss-err:hover { color: var(--text-primary); }

    /* Integration notice */
    .integration-notice-card {
      background: var(--color-accent-muted);
      border: 1px solid var(--color-accent-glow);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .notice-icon {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--color-accent);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .notice-content h3 {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--color-text-accent);
      margin-bottom: var(--space-1);
    }

    .notice-content p {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .settings-sections {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }

    .card-header {
      margin-bottom: var(--space-4);
    }

    .card-header h2 {
      font-size: var(--font-size-md);
      font-weight: 700;
    }

    .card-desc {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .folders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .folder-row {
      background: var(--bg-elevated);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .folder-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .folder-name {
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .folder-path {
      font-size: 11px;
      font-family: var(--font-family-mono);
      color: var(--text-muted);
    }

    .btn-remove-folder {
      font-size: var(--font-size-xs);
      color: var(--status-error);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      border: 1px solid rgba(239, 68, 68, 0.3);
      background: transparent;
      flex-shrink: 0;
    }

    .btn-remove-folder:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .folder-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .btn-primary {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--color-accent);
      color: #ffffff;
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .btn-primary:hover { background: var(--color-accent-hover); }

    .btn-secondary {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .btn-secondary:hover { background: var(--bg-surface-hover); }

    /* Prefs */
    .pref-rows {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .pref-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-subtle);
    }

    .pref-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .pref-label {
      display: flex;
      flex-direction: column;
    }

    .pref-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
    }

    .pref-desc {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .pref-control {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .volume-slider {
      width: 140px;
    }

    .pref-val {
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      color: var(--text-secondary);
      min-width: 36px;
    }

    .select-box {
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      outline: none;
    }

    .btn-toggle {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .btn-toggle.active {
      background: var(--color-accent-muted);
      border-color: var(--color-accent);
      color: var(--color-text-accent);
    }

    /* Appearance & Theme Section Styles */
    .appearance-card {
      position: relative;
    }

    .appearance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .theme-status-indicator {
      display: flex;
      align-items: center;
      min-height: 28px;
    }

    .theme-save-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 600;
      animation: fadeIn 0.2s ease-in-out;
    }

    .theme-save-badge.saving {
      background: var(--color-surface-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .theme-save-badge.saved {
      background: rgba(16, 185, 129, 0.12);
      color: var(--color-success, #10b981);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .spinner-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid var(--color-accent);
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
    }

    .theme-error-banner {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--status-error);
      font-size: var(--font-size-xs);
      font-weight: 500;
      margin-bottom: var(--space-4);
    }

    .appearance-sections {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .theme-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .theme-group-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .group-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
    }

    .group-title {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .group-tag {
      font-size: 11px;
      font-weight: 500;
      color: var(--color-text-muted);
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-hover);
    }

    .group-desc-inline {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-left: var(--space-1);
    }

    .preset-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-3);
    }

    .preset-card {
      display: flex;
      flex-direction: column;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
      outline: none;
      user-select: none;
    }

    .preset-card:hover {
      border-color: var(--color-border-strong);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--shadow-ambient, rgba(0, 0, 0, 0.15));
    }

    .preset-card:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .preset-card.active {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 1px var(--color-accent), 0 4px 14px var(--color-accent-glow);
    }

    /* Swatch Preview UI */
    .swatch-preview {
      position: relative;
      height: 76px;
      background: var(--p-canvas);
      border-bottom: 1px solid var(--p-border);
      display: flex;
      padding: 6px;
      gap: 5px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .swatch-sidebar {
      width: 24px;
      background: var(--p-sidebar);
      border-radius: 3px;
      border: 1px solid var(--p-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 3px;
      flex-shrink: 0;
    }

    .swatch-bar {
      height: 3px;
      background: var(--p-border);
      border-radius: 1.5px;
      opacity: 0.7;
    }

    .swatch-bar.short {
      width: 65%;
    }

    .swatch-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .swatch-header {
      height: 6px;
      background: var(--p-surface);
      border-radius: 2px;
      opacity: 0.6;
    }

    .swatch-content {
      flex: 1;
      background: var(--p-surface);
      border-radius: 3px;
      border: 1px solid var(--p-border);
      padding: 5px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .swatch-surface {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .swatch-line {
      height: 3px;
      background: var(--p-text);
      border-radius: 1.5px;
      opacity: 0.45;
      width: 80%;
    }

    .swatch-line.short {
      width: 50%;
      opacity: 0.25;
    }

    .selected-indicator {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-accent);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .preset-info {
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: var(--color-surface);
    }

    .preset-name {
      font-size: var(--font-size-xs);
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .preset-desc {
      font-size: 11px;
      color: var(--color-text-muted);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Accent Picker Section */
    .accent-picker-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border-subtle);
    }

    .accent-palette-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }

    .accent-option-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 6px 12px 6px 8px;
      border-radius: var(--radius-full);
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: all var(--transition-fast);
      user-select: none;
    }

    .accent-option-btn:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-border-strong);
      color: var(--color-text-primary);
      transform: translateY(-1px);
    }

    .accent-option-btn:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .accent-option-btn.active {
      background: var(--color-accent-muted);
      border-color: var(--color-accent);
      color: var(--color-text-accent);
      box-shadow: 0 0 12px var(--color-accent-glow);
    }

    .accent-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent-swatch);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    }

    .accent-label {
      line-height: 1;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-3px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 960px) {
      .preset-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .preset-card,
      .accent-option-btn,
      .spinner-dot,
      .theme-save-badge {
        transition: none !important;
        transform: none !important;
        animation: none !important;
      }
    }

    .about-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .about-item {
      background: var(--bg-elevated);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
    }

    .about-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .about-value {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 2px;
    }
  `]
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

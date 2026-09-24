import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LIBRARY_GATEWAY } from '../../../core/contracts';
import { getDesktopApi } from '../../../core/desktop/desktop-api';
import { NavigationHistoryService } from '../../../core/layout/navigation-history.service';
import { LIGHT_THEME_PRESETS, type ScanProgress } from '../../../core/models';
import { ThemeService } from '../../../core/theme/theme.service';
import { GlobalSearchComponent } from '../global-search/global-search.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, GlobalSearchComponent, IconComponent],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  private readonly gateway = inject(LIBRARY_GATEWAY);
  private readonly theme = inject(ThemeService);
  private readonly menuRoot = viewChild.required<ElementRef<HTMLElement>>('menuRoot');
  private readonly search = viewChild.required(GlobalSearchComponent);
  private readonly desktopApi = getDesktopApi();
  private wasScanning = false;

  readonly history = inject(NavigationHistoryService);
  readonly isDesktop = Boolean(this.desktopApi);
  readonly menuOpen = signal(false);
  readonly actionPending = signal(false);
  readonly menuError = signal<string | null>(null);
  readonly scanProgress = toSignal(this.gateway.scanProgress$, {
    initialValue: {
      isScanning: false, scannedFiles: 0, audioFiles: 0, currentPath: null, error: null,
    } satisfies ScanProgress,
  });
  readonly actionsDisabled = computed(() => this.actionPending() || this.scanProgress().isScanning);
  readonly statusLabel = computed(() => {
    const progress = this.scanProgress();
    if (progress.isScanning) return `Scanning · ${progress.scannedFiles}`;
    if (progress.error) return 'Scan warning';
    return '';
  });
  readonly statusTitle = computed(() => {
    const progress = this.scanProgress();
    if (progress.error) return progress.error;
    if (progress.isScanning) return progress.currentPath ?? `Scanning ${progress.scannedFiles} files`;
    return '';
  });

  constructor() {
    effect(() => {
      const preset = this.theme.themePreset();
      const mode = (LIGHT_THEME_PRESETS as readonly string[]).includes(preset) ? 'light' : 'dark';
      void this.desktopApi?.windowControls.setTitleBarAppearance(mode).catch(() => undefined);
    });
    effect(() => {
      const scanning = this.scanProgress().isScanning;
      if (this.wasScanning && !scanning) queueMicrotask(() => this.search().refreshIfOpen());
      this.wasScanning = scanning;
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.menuError.set(null);
  }
  closeMenu(): void { this.menuOpen.set(false); }

  async addMusicFolder(): Promise<void> {
    if (this.actionsDisabled()) return;
    this.actionPending.set(true);
    this.menuError.set(null);
    try {
      const folders = await this.gateway.selectAndAddMusicFolders();
      if (folders.length) await this.gateway.requestScan(folders.map((folder) => folder.id));
      this.closeMenu();
    } catch (error) {
      this.menuError.set(message(error, 'Music folder could not be added.'));
    } finally {
      this.actionPending.set(false);
    }
  }

  async rescanLibrary(): Promise<void> {
    if (this.actionsDisabled()) return;
    this.actionPending.set(true);
    this.menuError.set(null);
    try {
      await this.gateway.requestScan();
      this.closeMenu();
    } catch (error) {
      this.menuError.set(message(error, 'Library scan could not be started.'));
    } finally {
      this.actionPending.set(false);
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.menuRoot().nativeElement.contains(event.target as Node)) this.closeMenu();
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { this.closeMenu(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      this.search().focus();
    }
  }
}

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

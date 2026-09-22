import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild, effect, inject } from '@angular/core';
import { AUDIO_ANALYSIS_ENGINE } from '../../../core/contracts';
import { PlayerService } from '../../../core/player/player.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { FrequencyBand, createLogFrequencyBands, decaySpectrumLevels, updateSpectrumLevels } from './spectrum-utils';

const BAR_COUNT = 48;

@Component({
  selector: 'app-spectrum-visualizer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spectrum-panel" aria-hidden="true">
      <span class="spectrum-label">REAL-TIME SPECTRUM</span>
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: var(--space-6);
    }

    :host([hidden]) {
      display: none;
    }

    .spectrum-panel {
      position: relative;
      height: 128px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      background:
        linear-gradient(180deg, transparent, var(--accent-muted)),
        var(--bg-surface);
    }

    .spectrum-label {
      position: absolute;
      top: var(--space-2);
      left: var(--space-3);
      z-index: 1;
      color: var(--text-muted);
      font-family: var(--font-family-mono);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.08em;
      pointer-events: none;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    @media (max-width: 960px), (max-height: 700px) {
      :host {
        margin-bottom: var(--space-4);
      }

      .spectrum-panel {
        height: 80px;
      }

      .spectrum-label {
        top: 6px;
      }
    }
  `],
})
export class SpectrumVisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly analysis = inject(AUDIO_ANALYSIS_ENGINE);
  private readonly player = inject(PlayerService);
  private readonly theme = inject(ThemeService);
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly levels = new Float32Array(BAR_COUNT);
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private bands: FrequencyBand[] = [];
  private frameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private preparing: Promise<boolean> | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private viewReady = false;
  private destroyed = false;
  private accentColor = '#8b5cf6';
  private accentMuted = 'rgba(139, 92, 246, 0.15)';

  private readonly playbackEffect = effect(() => {
    this.player.currentTrack();
    this.player.playbackState();
    if (this.viewReady) this.syncPlaybackState();
  });

  private readonly themeEffect = effect(() => {
    this.theme.themePreset();
    this.theme.accentColor();
    if (this.viewReady) {
      this.readThemeColors();
      this.draw();
    }
  });

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.host.nativeElement.hidden = !this.analysis.isAnalysisSupported;
    this.context = this.canvasRef.nativeElement.getContext('2d');
    this.readThemeColors();
    this.resizeCanvas();
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
        this.draw();
      });
      this.resizeObserver.observe(this.canvasRef.nativeElement);
    }
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.reducedMotion.addEventListener('change', this.onMotionPreferenceChange);
    this.syncPlaybackState();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopLoop();
    this.resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.reducedMotion.removeEventListener('change', this.onMotionPreferenceChange);
  }

  private syncPlaybackState(): void {
    if (!this.player.currentTrack()) {
      this.levels.fill(0);
      this.stopLoop();
      this.draw();
      return;
    }

    void this.ensurePrepared().then((ready) => {
      if (!ready || this.destroyed || document.hidden) return;
      if (this.reducedMotion.matches) {
        if (this.player.isPlaying()) this.readLiveData();
        else decaySpectrumLevels(this.levels, 0.78);
        this.draw();
        return;
      }
      this.startLoop();
    });
  }

  private ensurePrepared(): Promise<boolean> {
    if (this.frequencyData) return Promise.resolve(true);
    if (!this.analysis.isAnalysisSupported) {
      this.host.nativeElement.hidden = true;
      return Promise.resolve(false);
    }
    if (this.preparing) return this.preparing;

    this.preparing = this.analysis.prepareFrequencyAnalysis().then((binCount) => {
      if (binCount <= 0 || this.destroyed) {
        this.host.nativeElement.hidden = true;
        return false;
      }
      this.frequencyData = new Uint8Array(binCount);
      this.bands = createLogFrequencyBands(binCount, BAR_COUNT);
      this.host.nativeElement.hidden = false;
      return true;
    }).catch(() => {
      this.host.nativeElement.hidden = true;
      return false;
    }).finally(() => {
      this.preparing = null;
    });
    return this.preparing;
  }

  private startLoop(): void {
    if (this.frameId !== null || this.destroyed || document.hidden) return;
    this.zone.runOutsideAngular(() => {
      const render = () => {
        this.frameId = null;
        if (this.destroyed || document.hidden || this.reducedMotion.matches) return;

        const state = this.player.playbackState();
        let keepRendering = true;
        if (state === 'playing') this.readLiveData();
        else if (state === 'loading') keepRendering = decaySpectrumLevels(this.levels, 0.985);
        else keepRendering = decaySpectrumLevels(this.levels, 0.9);
        this.draw();

        if (keepRendering) this.frameId = requestAnimationFrame(render);
      };
      this.frameId = requestAnimationFrame(render);
    });
  }

  private stopLoop(): void {
    if (this.frameId === null) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private readLiveData(): void {
    if (!this.frequencyData || !this.analysis.readFrequencyData(this.frequencyData)) return;
    updateSpectrumLevels(this.frequencyData, this.bands, this.levels);
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = this.context;
    if (!context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    context.clearRect(0, 0, width, height);

    const horizontalPadding = 12;
    const topPadding = 24;
    const bottomPadding = 10;
    const availableWidth = Math.max(1, width - horizontalPadding * 2);
    const availableHeight = Math.max(1, height - topPadding - bottomPadding);
    const gap = Math.max(2, Math.min(4, availableWidth / 180));
    const barWidth = Math.max(1, (availableWidth - gap * (BAR_COUNT - 1)) / BAR_COUNT);
    const gradient = context.createLinearGradient(0, topPadding, 0, height - bottomPadding);
    gradient.addColorStop(0, this.accentColor);
    gradient.addColorStop(1, this.accentMuted);
    context.fillStyle = gradient;

    for (let index = 0; index < BAR_COUNT; index++) {
      const barHeight = Math.max(2, this.levels[index] * availableHeight);
      const x = horizontalPadding + index * (barWidth + gap);
      const y = height - bottomPadding - barHeight;
      drawRoundedBar(context, x, y, barWidth, barHeight);
    }
  }

  private readThemeColors(): void {
    const styles = getComputedStyle(this.host.nativeElement);
    this.accentColor = styles.getPropertyValue('--accent-primary').trim() || '#8b5cf6';
    this.accentMuted = styles.getPropertyValue('--accent-muted').trim() || 'rgba(139, 92, 246, 0.15)';
  }

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.stopLoop();
    else this.syncPlaybackState();
  };

  private readonly onMotionPreferenceChange = (): void => {
    this.stopLoop();
    this.syncPlaybackState();
  };
}

function drawRoundedBar(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
  const radius = Math.min(width / 2, 3);
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

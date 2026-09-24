import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LIBRARY_GATEWAY, type LibraryGateway } from '../../../core/contracts/library.gateway';
import type { Track, TrackDetails } from '../../../core/models';
import { signal } from '@angular/core';
import { PlayerService } from '../../../core/player/player.service';
import { RightPanelService } from '../../../core/layout/right-panel.service';
import { TrackDetailsPanelComponent } from './track-details-panel.component';

describe('TrackDetailsPanelComponent', () => {
  let fixture: ComponentFixture<TrackDetailsPanelComponent>;
  let gateway: jasmine.SpyObj<LibraryGateway>;

  beforeEach(async () => {
    gateway = jasmine.createSpyObj<LibraryGateway>('LibraryGateway', ['getTrackDetails']);
    gateway.getTrackDetails.and.resolveTo(details);
    await TestBed.configureTestingModule({
      imports: [TrackDetailsPanelComponent],
      providers: [
        { provide: LIBRARY_GATEWAY, useValue: gateway },
        { provide: PlayerService, useValue: { currentTrack: signal<Track | null>(track) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackDetailsPanelComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads details by track ID and renders grouped parser values', () => {
    expect(gateway.getTrackDetails).toHaveBeenCalledOnceWith(track.id);
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(text).toContain('Metadata');
    expect(text).toContain('General');
    expect(text).toContain('File');
    expect(text).toContain('Nghiêm Vũ Hoàng Long');
    expect(text).toContain('3:53.250 (22 391 968 samples)');
    expect(text).toContain('A07AF08B');
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('thead')).toBeNull();
    expect(element.querySelectorAll('.property-section').length).toBe(3);
    expect(element.querySelectorAll('.property-row').length).toBeGreaterThan(0);
    expect(getComputedStyle(element.querySelector('.property-section h3')!).position).toBe('static');
  });

  it('omits fields that the parser did not provide', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Codec Profile');
    expect(text).not.toContain('N/A');
    expect(text).not.toContain('Unknown');
  });

  it('uses a dedicated vertical scroll area instead of a modal backdrop', () => {
    const element = fixture.nativeElement as HTMLElement;
    const content = element.querySelector<HTMLElement>('.panel-content')!;
    expect(getComputedStyle(content).overflowY).toBe('auto');
    expect(getComputedStyle(content).scrollbarWidth).toBe('auto');
    expect(element.querySelector('dialog')).toBeNull();
    expect(element.querySelector('aside')).not.toBeNull();
  });

  it('shows a recoverable error and retries the request', async () => {
    gateway.getTrackDetails.calls.reset();
    gateway.getTrackDetails.and.rejectWith(new Error('locked'));
    fixture.componentInstance.retry();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Track details could not be loaded');

    gateway.getTrackDetails.and.resolveTo(details);
    fixture.componentInstance.retry();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Audio MD5');
  });

  it('resizes with the keyboard and resets to the session default', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    fixture.componentInstance.onResizeKeyDown(event);
    expect(fixture.componentInstance.effectiveWidth()).toBe(584);
    expect(TestBed.inject(RightPanelService).trackDetailsWidth()).toBe(584);
    fixture.componentInstance.resetWidth();
    expect(fixture.componentInstance.effectiveWidth()).toBe(600);
  });

  it('coalesces pointer movement into one DOM update and commits width only on release', () => {
    let frameCallback: FrameRequestCallback = () => fail('requestAnimationFrame callback was not captured');
    const requestFrame = spyOn(window, 'requestAnimationFrame').and.callFake((callback) => {
      frameCallback = callback;
      return 17;
    });
    spyOn(window, 'cancelAnimationFrame');
    const service = TestBed.inject(RightPanelService);
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.onResizeStart(pointer('pointerdown', 600));
    fixture.componentInstance.onResizeMove(pointer('pointermove', 560));
    fixture.componentInstance.onResizeMove(pointer('pointermove', 520));

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(service.trackDetailsWidth()).toBe(600);
    expect(fixture.componentInstance.effectiveWidth()).toBe(600);
    expect(host.classList).toContain('resizing');

    frameCallback(0);
    expect(host.style.getPropertyValue('--drag-width')).toBe('680px');

    fixture.componentInstance.onResizeEnd(pointer('pointerup', 520));
    expect(service.trackDetailsWidth()).toBe(680);
    expect(fixture.componentInstance.effectiveWidth()).toBe(680);
    expect(host.classList).not.toContain('resizing');
    expect(document.body.style.userSelect).toBe('');
  });

  it('cleans up a cancelled pointer gesture and commits its last frame', () => {
    spyOn(window, 'requestAnimationFrame').and.returnValue(19);
    spyOn(window, 'cancelAnimationFrame');
    const service = TestBed.inject(RightPanelService);

    fixture.componentInstance.onResizeStart(pointer('pointerdown', 600));
    fixture.componentInstance.onResizeMove(pointer('pointermove', 650));
    fixture.componentInstance.onResizeEnd(pointer('pointercancel', 0));

    expect(service.trackDetailsWidth()).toBe(550);
    expect((fixture.nativeElement as HTMLElement).classList).not.toContain('resizing');
    expect(document.body.style.cursor).toBe('');
  });

  it('clamps the panel to preserve main content on a compact workspace', () => {
    const host = fixture.nativeElement as HTMLElement;
    const main = document.createElement('main');
    main.className = 'main-content';
    host.parentElement!.insertBefore(main, host);
    spyOn(main, 'getBoundingClientRect').and.returnValue({ width: 100 } as DOMRect);
    spyOn(host, 'getBoundingClientRect').and.returnValue({ width: 600 } as DOMRect);
    fixture.componentInstance.onWindowResize();
    expect(fixture.componentInstance.effectiveWidth()).toBe(420);
    expect(fixture.componentInstance.maxWidth()).toBe(420);
    main.remove();
  });
});

function pointer(type: string, clientX: number): PointerEvent {
  return new PointerEvent(type, { button: 0, clientX, pointerId: 1 });
}

const track: Track = {
  id: `track-${'a'.repeat(64)}`,
  path: 'G:\\Music\\12. Liệm.flac',
  fileName: '12. Liệm.flac',
  title: 'Liệm',
  artist: 'RPT MCK',
  albumArtist: 'RPT MCK',
  album: 'HVL',
  genre: 'Hip-Hop',
  year: 2026,
  trackNumber: 12,
  discNumber: 1,
  duration: 233.25,
  codec: 'FLAC',
  bitrate: 3016000,
  sampleRate: 96000,
  bitDepth: 24,
  channels: 2,
  artwork: null,
  fileSize: 90_282_394,
  lastModified: 1_800_000_000_000,
  isAvailable: true,
};

const details: TrackDetails = {
  trackId: track.id,
  metadata: {
    title: 'Liệm', artists: ['RPT MCK'], album: 'HVL', albumArtists: ['RPT MCK'], date: '2026-06-17', year: 2026,
    composers: ['Nghiêm Vũ Hoàng Long'], genres: ['Hip-Hop'], trackNumber: 12, totalTracks: 30, discNumber: 1, totalDiscs: 1,
  },
  audio: {
    duration: 233.25, numberOfSamples: 22_391_968, sampleRate: 96000, channels: 2, bitsPerSample: 24,
    bitrate: 3_016_000, codec: 'FLAC', codecProfile: null, container: 'FLAC', lossless: true,
    encoderTool: 'Lavf60.16.100', tagTypes: ['vorbis'], audioMd5: 'A07AF08B',
  },
  file: {
    fileName: track.fileName, path: track.path, fileSize: track.fileSize, lastModified: track.lastModified,
  },
};

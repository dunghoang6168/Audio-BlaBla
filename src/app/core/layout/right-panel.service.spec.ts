import { TestBed } from '@angular/core/testing';
import { RightPanelService } from './right-panel.service';

describe('RightPanelService', () => {
  let service: RightPanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RightPanelService);
  });

  it('keeps queue and track properties mutually exclusive', () => {
    service.toggleQueue();
    expect(service.isQueueOpen()).toBeTrue();
    service.openTrackDetails();
    expect(service.isQueueOpen()).toBeFalse();
    expect(service.isTrackDetailsOpen()).toBeTrue();
    service.toggleQueue();
    expect(service.isTrackDetailsOpen()).toBeFalse();
    expect(service.isQueueOpen()).toBeTrue();
  });

  it('keeps the resized width for later openings in the same session', () => {
    service.setTrackDetailsWidth(544);
    service.openTrackDetails();
    service.closeTrackDetails(false);
    service.openTrackDetails();
    expect(service.trackDetailsWidth()).toBe(544);
  });

  it('restores focus to the opening control when details close', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    spyOn(opener, 'focus');
    service.openTrackDetails(opener);
    service.closeTrackDetails();
    await Promise.resolve();
    expect(opener.focus).toHaveBeenCalled();
    opener.remove();
  });
});

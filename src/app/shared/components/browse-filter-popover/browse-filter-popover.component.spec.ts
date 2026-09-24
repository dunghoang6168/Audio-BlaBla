import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowseFilterPopoverComponent } from './browse-filter-popover.component';

describe('BrowseFilterPopoverComponent', () => {
  let fixture: ComponentFixture<BrowseFilterPopoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BrowseFilterPopoverComponent] }).compileComponents();
    fixture = TestBed.createComponent(BrowseFilterPopoverComponent);
    fixture.detectChanges();
  });

  it('opens beside the trigger and closes with Escape, returning focus', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-trigger');
    const panel: HTMLElement = fixture.nativeElement.querySelector('.filter-panel');
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(panel.matches(':popover-open')).toBeTrue();
    expect(panel.style.left).not.toBe('');
    expect(panel.style.top).not.toBe('');
    panel.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel.matches(':popover-open')).toBeFalse();
    expect(document.activeElement).toBe(button);
  });

  it('keeps the panel within the viewport when the trigger is near an edge', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-trigger');
    const panel: HTMLElement = fixture.nativeElement.querySelector('.filter-panel');
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(Number.parseFloat(panel.style.left)).toBeGreaterThanOrEqual(12);
    expect(Number.parseFloat(panel.style.left) + panel.offsetWidth).toBeLessThanOrEqual(window.innerWidth - 11);
    panel.hidePopover();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchableFilterSelectComponent } from './searchable-filter-select.component';

describe('SearchableFilterSelectComponent', () => {
  let fixture: ComponentFixture<SearchableFilterSelectComponent>;
  let component: SearchableFilterSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchableFilterSelectComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchableFilterSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Artist');
    fixture.componentRef.setInput('options', ['Fuji Kaze', 'Đen', 'aespa']);
    fixture.componentRef.setInput('allLabel', 'All artists');
    fixture.componentRef.setInput('includeUnknown', true);
    fixture.componentRef.setInput('unknownValue', '__unknown_artist__');
    fixture.componentRef.setInput('unknownLabel', 'Unknown Artist');
    fixture.detectChanges();
  });

  it('finds accented names, keeps All and Unknown, and resets search on reopen', async () => {
    const selected = jasmine.createSpy('selected');
    component.valueChange.subscribe(selected);
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.select-trigger');
    trigger.click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.option-search');
    input.value = 'fuji';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(optionLabels(fixture)).toEqual(['Fuji Kaze']);
    input.value = 'den';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(optionLabels(fixture)).toEqual(['Đen']);
    input.value = 'missing';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-options').textContent).toContain('No matches');
    component.close();
    trigger.click();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.option-search') as HTMLInputElement).value).toBe('');
    expect(optionLabels(fixture)).toContain('All artists');
    expect(optionLabels(fixture)).toContain('Unknown Artist');
    const unknown = [...fixture.nativeElement.querySelectorAll('.option-item')].find((item: Element) => item.textContent?.includes('Unknown Artist')) as HTMLButtonElement;
    unknown.click();
    expect(selected).toHaveBeenCalledWith('__unknown_artist__');
  });

  it('selects with arrows and Enter, and Escape closes the inner list first', () => {
    const selected = jasmine.createSpy('selected');
    component.valueChange.subscribe(selected);
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.select-trigger');
    trigger.click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.option-search');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(selected).toHaveBeenCalledWith('Fuji Kaze');
    trigger.click();
    fixture.detectChanges();
    let outerEscapeCount = 0;
    const onOuterEscape = () => outerEscapeCount++;
    document.addEventListener('keydown', onOuterEscape);
    try {
      (fixture.nativeElement.querySelector('.option-search') as HTMLInputElement)
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(component.isOpen()).toBeFalse();
      expect(outerEscapeCount).toBe(0);
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(outerEscapeCount).toBe(1);
    } finally {
      document.removeEventListener('keydown', onOuterEscape);
    }
  });

  it('bounds a long list to 200 pixels and closes on an outside pointer', () => {
    fixture.componentRef.setInput('options', Array.from({ length: 70 }, (_, index) => `Artist ${index}`));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.select-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const list: HTMLElement = fixture.nativeElement.querySelector('.option-list');
    expect(list.clientHeight).toBeLessThanOrEqual(200);
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(component.isOpen()).toBeFalse();
  });
});

function optionLabels(fixture: ComponentFixture<SearchableFilterSelectComponent>): string[] {
  return [...fixture.nativeElement.querySelectorAll('.option-item')].map((item: Element) => item.textContent?.trim() ?? '');
}
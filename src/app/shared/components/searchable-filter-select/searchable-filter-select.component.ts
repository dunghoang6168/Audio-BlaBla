import { Component, ElementRef, HostListener, computed, inject, input, output, signal, viewChild } from '@angular/core';

interface FilterChoice {
  value: string;
  label: string;
}

let nextListId = 0;

@Component({
  selector: 'app-searchable-filter-select',
  standalone: true,
  template: `
    <div class="searchable-select" (keydown)="onKeydown($event)">
      <button #trigger type="button" class="select-trigger" [attr.aria-label]="label() + ': ' + selectedLabel()"
        [attr.aria-expanded]="isOpen()" [attr.aria-controls]="listId" (click)="toggle()">
        <span class="selected-label">{{ selectedLabel() }}</span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      @if (isOpen()) {
        <div class="select-dropdown">
          <input #searchInput type="search" class="option-search" autocomplete="off" spellcheck="false"
            role="combobox" aria-autocomplete="list" [attr.aria-label]="'Search ' + label()" [placeholder]="'Search ' + label().toLowerCase() + '...'"
            [attr.aria-controls]="listId" [attr.aria-expanded]="true"
            [attr.aria-activedescendant]="activeOptionId()"
            [value]="query()" (input)="updateQuery($event)" />
          <div class="option-list" [id]="listId" role="listbox" [attr.aria-label]="label()">
            @for (choice of visibleChoices(); track choice.value; let index = $index) {
              <button type="button" role="option" class="option-item" [id]="optionId(index)"
                [class.active]="activeIndex() === index" [class.selected]="value() === choice.value"
                [attr.aria-selected]="value() === choice.value" (mouseenter)="activeIndex.set(index)"
                (click)="choose(choice.value)">{{ choice.label }}</button>
            } @empty {
              <div class="no-options">No matches</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .searchable-select { min-width: 0; }
    .select-trigger, .option-search { width: 100%; height: 36px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-elevated); color: var(--text-primary); font: inherit; }
    .select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 10px; text-align: left; cursor: pointer; }
    .select-trigger:hover, .select-trigger[aria-expanded="true"] { border-color: var(--accent-primary); }
    .selected-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chevron { flex: none; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: translateY(-2px) rotate(45deg); }
    .select-dropdown { margin-top: 4px; padding: 6px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-elevated); }
    .option-search { padding: 0 10px; background: var(--bg-surface); }
    .option-list { max-height: 200px; overflow-y: auto; margin-top: 6px; overscroll-behavior: contain; }
    .option-item { display: block; width: 100%; min-height: 32px; padding: 6px 9px; border-radius: var(--radius-sm); color: var(--text-primary); text-align: left; cursor: pointer; overflow-wrap: anywhere; }
    .option-item:hover, .option-item.active { background: var(--bg-surface-hover); }
    .option-item.selected { color: var(--accent-primary); font-weight: 600; }
    .option-item.selected::after { content: '\u2713'; float: right; margin-left: 8px; }
    .no-options { padding: 9px; color: var(--text-muted); font-size: var(--font-size-sm); }
    .select-trigger:focus-visible, .option-search:focus-visible, .option-item:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 1px; }
  `],
})
export class SearchableFilterSelectComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly string[]>([]);
  readonly value = input('');
  readonly allLabel = input('All');
  readonly includeUnknown = input(false);
  readonly unknownValue = input('unknown');
  readonly unknownLabel = input('Unknown');
  readonly valueChange = output<string>();
  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly listId = `searchable-filter-${++nextListId}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly selectedLabel = computed(() => {
    const selected = this.value();
    return !selected ? this.allLabel() : selected === this.unknownValue() ? this.unknownLabel() : selected;
  });
  readonly visibleChoices = computed<FilterChoice[]>(() => {
    const term = normalize(this.query().trim());
    const choices: FilterChoice[] = [
      { value: '', label: this.allLabel() },
      ...this.options().map((option) => ({ value: option, label: option })),
      ...(this.includeUnknown() ? [{ value: this.unknownValue(), label: this.unknownLabel() }] : []),
    ];
    return term ? choices.filter((choice) => normalize(choice.label).includes(term)) : choices;
  });
  readonly activeOptionId = computed(() => this.visibleChoices().length ? this.optionId(this.activeIndex()) : null);

  optionId(index: number): string { return `${this.listId}-option-${index}`; }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  open(): void {
    this.query.set('');
    this.isOpen.set(true);
    this.activeIndex.set(Math.max(0, this.visibleChoices().findIndex((choice) => choice.value === this.value())));
    setTimeout(() => { if (this.isOpen()) this.searchInput()?.nativeElement.focus(); }, 0);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
  }

  choose(value: string): void {
    this.valueChange.emit(value);
    this.close();
    this.trigger().nativeElement.focus();
  }

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      this.trigger().nativeElement.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.visibleChoices().length) return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.update((index) => (index + step + this.visibleChoices().length) % this.visibleChoices().length);
      queueMicrotask(() => this.host.nativeElement.querySelector(`#${this.optionId(this.activeIndex())}`)?.scrollIntoView({ block: 'nearest' }));
    } else if (event.key === 'Enter' && event.target === this.searchInput()?.nativeElement) {
      const choice = this.visibleChoices()[this.activeIndex()];
      if (choice) { event.preventDefault(); this.choose(choice.value); }
    } else if (event.key === 'Tab') {
      this.close();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onOutsidePointer(event: Event): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('\u0111', 'd');
}

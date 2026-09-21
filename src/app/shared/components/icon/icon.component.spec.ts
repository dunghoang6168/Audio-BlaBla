import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

@Component({
  standalone: true,
  imports: [IconComponent],
  template: `<app-icon [name]="iconName" [size]="iconSize" />`,
})
class TestHostComponent {
  iconName: IconName = 'home';
  iconSize = 24;
}

describe('IconComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render icon svg with requested size', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('should switch icon paths when name changes', () => {
    host.iconName = 'play';
    fixture.detectChanges();
    const polygon = fixture.nativeElement.querySelector('polygon');
    expect(polygon).toBeTruthy();
    expect(polygon.getAttribute('points')).toBe('8 5 19 12 8 19');
  });
});

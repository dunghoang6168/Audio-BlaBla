import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { NavigationHistoryService } from './navigation-history.service';

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('NavigationHistoryService', () => {
  let router: Router;
  let history: NavigationHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([
        { path: 'home', component: EmptyRouteComponent },
        { path: 'songs', component: EmptyRouteComponent },
        { path: 'settings', component: EmptyRouteComponent },
      ])],
    });
    router = TestBed.inject(Router);
    history = TestBed.inject(NavigationHistoryService);
  });

  it('tracks back and forward navigation without duplicating history entries', async () => {
    await router.navigateByUrl('/home');
    await router.navigateByUrl('/songs');
    expect(history.canGoBack()).toBeTrue();
    expect(history.canGoForward()).toBeFalse();

    const backFinished = nextNavigation(router);
    history.back();
    await backFinished;
    expect(router.url).toBe('/home');
    expect(history.canGoBack()).toBeFalse();
    expect(history.canGoForward()).toBeTrue();

    const forwardFinished = nextNavigation(router);
    history.forward();
    await forwardFinished;
    expect(router.url).toBe('/songs');
  });

  it('drops forward history after a new navigation branch', async () => {
    await router.navigateByUrl('/home');
    await router.navigateByUrl('/songs');
    const backFinished = nextNavigation(router);
    history.back();
    await backFinished;
    await router.navigateByUrl('/settings');
    expect(history.canGoForward()).toBeFalse();
  });
});

function nextNavigation(router: Router): Promise<NavigationEnd> {
  return firstValueFrom(router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)));
}

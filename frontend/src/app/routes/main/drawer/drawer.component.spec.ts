// src/app/routes/main/drawer/drawer.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DrawerComponent } from './drawer.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectIsMobile } from '../../../core/state/lib/layout/layout.selectors';
import {
  selectDrawerExpanded,
  selectDrawerMode,
  selectSelectedStop,
} from '../../../core/state/lib/user/user.selectors';
import { DrawerMode } from '../../../core/utils/global.types';

class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

describe('DrawerComponent', () => {
  let component: DrawerComponent;
  let fixture: ComponentFixture<DrawerComponent>;
  let store: MockStore;

  beforeAll(() => {
    (window as any).ResizeObserver = MockResizeObserver;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsMobile, value: true },
            { selector: selectDrawerExpanded, value: false },
            { selector: selectDrawerMode, value: DrawerMode.Stops },
            { selector: selectSelectedStop, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compute mobile class when isMobile is true and drawer is not expanded', fakeAsync(() => {
    store.overrideSelector(selectIsMobile, true);
    store.overrideSelector(selectDrawerExpanded, false);
    store.refreshState();
    fixture.detectChanges();
    tick(); // Allow observables to emit

    component.drawerContainerClasses$.subscribe((classes) => {
      expect(classes).toContain('absolute bottom-0 left-0 w-full');
      expect(classes).toContain('translate-y-[60%]');
    });
    tick(300); // Flush timer from subscription
  }));

  it('should compute mobile class with expanded state when drawer is expanded', fakeAsync(() => {
    store.overrideSelector(selectIsMobile, true);
    store.overrideSelector(selectDrawerExpanded, true);
    store.refreshState();
    fixture.detectChanges();
    tick();

    component.drawerContainerClasses$.subscribe((classes) => {
      expect(classes).toContain('translate-y-0');
    });
    tick(300);
  }));

  it('should compute desktop class when isMobile is false', fakeAsync(() => {
    store.overrideSelector(selectIsMobile, false);
    store.overrideSelector(selectDrawerExpanded, false);
    store.refreshState();
    fixture.detectChanges();
    tick();

    component.drawerContainerClasses$.subscribe((classes) => {
      expect(classes).toContain('absolute left-10 top-10');
      expect(classes).toContain('w-[375px]');
    });
    tick(300);
  }));
});

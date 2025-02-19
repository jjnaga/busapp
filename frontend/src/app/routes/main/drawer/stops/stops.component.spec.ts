import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StopsComponent } from './stops.component';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { Stop } from '../../../../core/utils/global.types';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { selectAllStopsSortedByDistance } from '../../../../core/state/lib/stops/stops.selectors';
import * as StopsActions from '../../../../core/state/lib/stops/stops.actions';
import { selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

(window as any).IntersectionObserver = class {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  observe(target: Element) {}
  unobserve(target: Element) {}
  disconnect() {}
};

const mockStop: Stop = {
  stopId: '1',
  stopCode: '001',
  stopName: 'Test Stop',
  stopLat: 21.3069,
  stopLon: -157.8583,
  stopUrl: null,
  stopSerialNumber: 1,
};

const mockStopsArray: Stop[] = [
  {
    stopId: '1',
    stopCode: '001',
    stopName: 'Stop 1',
    stopLat: 21.3069,
    stopLon: -157.8583,
    stopUrl: null,
    stopSerialNumber: 1,
  },
  {
    stopId: '2',
    stopCode: '002',
    stopName: 'Stop 2',
    stopLat: 21.307,
    stopLon: -157.8584,
    stopUrl: null,
    stopSerialNumber: 2,
  },
  {
    stopId: '3',
    stopCode: '003',
    stopName: 'Stop 3',
    stopLat: 21.3071,
    stopLon: -157.8585,
    stopUrl: null,
    stopSerialNumber: 3,
  },
];

describe('StopsComponent', () => {
  let component: StopsComponent;
  let fixture: ComponentFixture<StopsComponent>;
  let storeMock: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StopsComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectSelectedStop, value: null }, // Set to null to show stops list
            { selector: selectAllStopsSortedByDistance, value: mockStopsArray },
          ],
        }),
      ],
    }).compileComponents();

    storeMock = TestBed.inject(MockStore);
    storeMock.dispatch = jest.fn();

    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;

    // Set initial values
    component.paginatedStops$ = of(mockStopsArray);
    component.selectedStop$ = of(undefined); // Force stopsListTemplate to be shown

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch toggleFavoriteAction when toggle favorite button is clicked', () => {
    // Force the selectedStop template to be shown
    component.selectedStop$ = of(mockStop);
    fixture.detectChanges();

    const favoriteBtn: HTMLElement = fixture.nativeElement.querySelector('button[aria-label="toggle-favorite"]');
    expect(favoriteBtn).toBeTruthy();
    favoriteBtn.click();
    fixture.detectChanges();
    expect(storeMock.dispatch).toHaveBeenCalledWith(toggleFavoriteAction({ stop: mockStop }));
  });

  it('should dispatch nextStop action when Next button is clicked', () => {
    // Force the selectedStop template to be shown
    component.selectedStop$ = of(mockStop);
    fixture.detectChanges();

    // Query using an aria-label selector (make sure template text is "Next")
    const nextButton = fixture.debugElement.query(By.css('button[aria-label="next-stop"]'));
    expect(nextButton).toBeTruthy();
    nextButton.nativeElement.click();
    fixture.detectChanges();
    expect(storeMock.dispatch).toHaveBeenCalledWith(StopsActions.nextStop());
  });

  it('should dispatch previousStop action when Previous button is clicked', () => {
    // Force the selectedStop template to be shown
    component.selectedStop$ = of(mockStop);
    fixture.detectChanges();

    const prevButton = fixture.debugElement.query(By.css('button[aria-label="previous-stop"]'));
    expect(prevButton).toBeTruthy();
    prevButton.nativeElement.click();
    fixture.detectChanges();
    expect(storeMock.dispatch).toHaveBeenCalledWith(StopsActions.previousStop());
  });

  it('should set isFavorite$ to true if selected stop is a favorite', () => {
    storeMock.overrideSelector(selectSelectedStop, mockStop);
    storeMock.overrideSelector(selectIsFavorite(mockStop.stopId), true);

    fixture.detectChanges();

    component.isFavorite$?.subscribe((isFavorite) => {
      expect(isFavorite).toBe(true);
    });
  });

  it('should set isFavorite$ to false if selected stop is not a favorite', () => {
    storeMock.overrideSelector(selectSelectedStop, mockStop);
    storeMock.overrideSelector(selectIsFavorite(mockStop.stopId), false);

    fixture.detectChanges();

    component.isFavorite$?.subscribe((isFavorite) => {
      expect(isFavorite).toBe(false);
    });
  });

  it('should set up IntersectionObserver for loadMore element', async () => {
    // Force the stopsListTemplate to be shown
    component.selectedStop$ = of(undefined);
    component.paginatedStops$ = of(mockStopsArray);

    // Force template to update
    fixture.detectChanges();
    await fixture.whenStable();

    // Now the loadMore element should be available
    const loadMoreElement = fixture.debugElement.query(By.css('[data-testid="load-more"]'));
    expect(loadMoreElement).toBeTruthy();
  });
});

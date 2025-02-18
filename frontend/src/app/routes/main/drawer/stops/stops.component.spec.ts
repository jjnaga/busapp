import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StopsComponent } from './stops.component';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { Stop } from '../../../../core/utils/global.types';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { selectAllStopsSortedByDistance } from '../../../../core/state/lib/stops/stops.selectors';
import * as StopsActions from '../../../../core/state/lib/stops/stops.actions';
import { selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';

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
            { selector: selectSelectedStop, value: mockStop },
            // Provide the sorted stops array for the component’s stopsSortedByDistance$
            { selector: selectAllStopsSortedByDistance, value: mockStopsArray },
          ],
        }),
      ],
    }).compileComponents();

    storeMock = TestBed.inject(MockStore);
    storeMock.dispatch = jest.fn();

    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should dispatch toggleFavoriteAction when toggle favorite button is clicked', () => {
    const favoriteBtn: HTMLElement = fixture.nativeElement.querySelector('button[aria-label="toggle-favorite"]');
    favoriteBtn.click();
    fixture.detectChanges();
    expect(storeMock.dispatch).toHaveBeenCalledWith(toggleFavoriteAction({ stop: mockStop }));
  });

  it('should dispatch nextStop action when Next button is clicked', () => {
    // Find the button with text 'Next'
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    let nextButton: HTMLButtonElement | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.trim() === 'Next') {
        nextButton = btn;
      }
    });
    expect(nextButton).toBeTruthy();
    nextButton!.click();
    fixture.detectChanges();
    expect(storeMock.dispatch).toHaveBeenCalledWith(StopsActions.nextStop());
  });

  it('should dispatch previousStop action when Previous button is clicked', () => {
    // Find the button with text 'Previous'
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    let prevButton: HTMLButtonElement | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.trim() === 'Previous') {
        prevButton = btn;
      }
    });
    expect(prevButton).toBeTruthy();
    prevButton!.click();
    fixture.detectChanges();
    expect(storeMock.dispatch).toHaveBeenCalledWith(StopsActions.previousStop());
  });

  it('should set isFavorite$ to true if selected stop is a favorite', () => {
    storeMock.overrideSelector(selectSelectedStop, mockStop);
    storeMock.overrideSelector(selectIsFavorite(mockStop.stopId), true); // Mock the isFavorite selector

    fixture.detectChanges();

    component.isFavorite$?.subscribe((isFavorite) => {
      expect(isFavorite).toBe(true);
    });
  });

  it('should set isFavorite$ to false if selected stop is not a favorite', () => {
    storeMock.overrideSelector(selectSelectedStop, mockStop);
    storeMock.overrideSelector(selectIsFavorite(mockStop.stopId), false); // Mock the isFavorite selector

    fixture.detectChanges();

    component.isFavorite$?.subscribe((isFavorite) => {
      expect(isFavorite).toBe(false);
    });
  });
});

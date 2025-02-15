import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StopsComponent } from './stops.component';
import { Store } from '@ngrx/store';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { Stop } from '../../../../core/utils/global.types';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';
import { selectAllStopsSortedByDistance } from '../../../../core/state/lib/stops/stops.selectors';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';

// Mock a complete Stop object
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
  let storeMock: jest.Mocked<Store>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StopsComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectSelectedStop, value: mockStop },
            { selector: selectIsFavorite(mockStop.stopId), value: false },
            // <-- Provide our mockStopsArray so the component’s stopsArray gets set correctly
            { selector: selectAllStopsSortedByDistance, value: mockStopsArray },
          ],
        }),
      ],
    }).compileComponents();

    storeMock = TestBed.inject(Store) as jest.Mocked<Store>;
    storeMock.dispatch = jest.fn();

    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should dispatch toggleFavoriteAction with complete Stop object', () => {
    const favoriteBtn = fixture.nativeElement.querySelector('button[aria-label="toggle-favorite"]');

    favoriteBtn.click();
    fixture.detectChanges();

    expect(storeMock.dispatch).toHaveBeenCalledWith(toggleFavoriteAction({ stop: mockStop }));
  });

  it('should cycle to the next stop', () => {
    component.goToNextStop();
    expect(component.currentStopIndex).toBe(1);
    expect(storeMock.dispatch).toHaveBeenCalledWith(setSelectedStop({ stop: mockStopsArray[1] }));
  });

  it('should cycle to the previous stop (wrapping around)', () => {
    component.currentStopIndex = 0;
    component.goToPreviousStop();
    expect(component.currentStopIndex).toBe(2);
    expect(storeMock.dispatch).toHaveBeenCalledWith(setSelectedStop({ stop: mockStopsArray[2] }));
  });
});

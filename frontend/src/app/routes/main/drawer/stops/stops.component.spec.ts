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
            { selector: selectAllStopsSortedByDistance, value: [] },
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
    console.log('huh??', favoriteBtn);

    favoriteBtn.click();
    fixture.detectChanges();

    expect(storeMock.dispatch).toHaveBeenCalledWith(toggleFavoriteAction({ stop: mockStop }));
  });
});

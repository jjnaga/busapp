import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { HomeComponent } from './home.component';
import { selectFavoritesWithLiveData } from '../../../../core/state/lib/stops/stops.selectors';
import { selectAllStopsSortedByDistance } from '../../../../core/state/lib/stops/stops.selectors';
import { selectUserLocation } from '../../../../core/state/lib/user-location/user-location.selectors';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectFavoritesWithLiveData, value: [] },
            { selector: selectAllStopsSortedByDistance, value: [] },
            { selector: selectUserLocation, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle empty state correctly', () => {
    component.nearbyStops$.subscribe((stops) => {
      expect(stops).toEqual([]);
    });

    component.otherFavorites$.subscribe((favorites) => {
      expect(favorites).toEqual([]);
    });
  });
});

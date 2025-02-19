// favorites.effects.spec.ts
import { TestBed } from '@angular/core/testing';
import { FavoritesEffects } from './favorites.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import * as FavoritesActions from './favorites.actions';
import * as StopsActions from '../stops/stops.actions';
import { appInit } from '../../root.actions';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAllFavoriteIds, selectAllFavoriteEntities } from './favorites.selectors';
import { Stop } from '../../../utils/global.types';

describe('FavoritesEffects', () => {
  let actions$: Observable<any>;
  let effects: FavoritesEffects;
  let store: MockStore;
  const mockStop: Stop = {
    stopId: '1',
    stopCode: '001',
    stopName: 'Test Stop',
    stopLat: 10,
    stopLon: 20,
    stopUrl: null,
    stopSerialNumber: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FavoritesEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectAllFavoriteIds, value: [mockStop.stopId] },
            { selector: selectAllFavoriteEntities, value: { [mockStop.stopId]: mockStop.stopId } },
          ],
        }),
      ],
    });

    effects = TestBed.inject(FavoritesEffects);
    store = TestBed.inject(MockStore);
  });

  it('should dispatch startTrackingStops on appInit if favorites exist', (done) => {
    actions$ = of(appInit());
    effects.onInitLoadFavoritesToTracking$.subscribe((action) => {
      expect(action).toEqual(StopsActions.startTrackingStops({ stopIds: [mockStop.stopId] }));
      done();
    });
  });

  it('should dispatch stopTrackingStops on toggleFavorite when stop is already favorite', (done) => {
    actions$ = of(FavoritesActions.toggleFavoriteAction({ stop: mockStop }));
    effects.toggleFavorite$.subscribe((action) => {
      expect(action).toEqual(StopsActions.stopTrackingStops({ stopIds: [mockStop.stopId] }));
      done();
    });
  });

  it('should dispatch startTrackingStops on toggleFavorite when stop is not favorite', (done) => {
    store.overrideSelector(selectAllFavoriteEntities, {});
    store.refreshState();
    actions$ = of(FavoritesActions.toggleFavoriteAction({ stop: mockStop }));
    effects.toggleFavorite$.subscribe((action) => {
      expect(action).toEqual(StopsActions.startTrackingStops({ stopIds: [mockStop.stopId] }));
      done();
    });
  });
});

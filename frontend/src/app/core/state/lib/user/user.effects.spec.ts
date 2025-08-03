// user.effects.spec.ts
import { TestBed } from '@angular/core/testing';
import { UserEffects } from './user.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import * as UserActions from './user.actions';
import { DrawerMode, Stop } from '../../../utils/global.types';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UserEffects', () => {
  let actions$: Observable<any>;
  let effects: UserEffects;
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
      imports: [HttpClientTestingModule], // Add this line
      providers: [UserEffects, provideMockActions(() => actions$)],
    });

    effects = TestBed.inject(UserEffects);
  });

  it('should dispatch toggleDrawerExpanded and setDrawerMode on setSelectedStop with a stop', (done) => {
    actions$ = of(UserActions.setSelectedStop({ stop: mockStop }));
    effects.toggleDrawerOnSelectedStop$.subscribe((action) => {
      if (action.type === UserActions.toggleDrawerExpanded.type) {
        expect(action).toEqual(UserActions.toggleDrawerExpanded({ expanded: true }));
      } else if (action.type === UserActions.setDrawerMode.type) {
        expect(action).toEqual(UserActions.setDrawerMode({ drawerMode: DrawerMode.Home }));
        done();
      }
    });
  });

  it('should dispatch NOOP when setSelectedStop is called with null', (done) => {
    actions$ = of(UserActions.setSelectedStop({ stop: null }));
    effects.toggleDrawerOnSelectedStop$.subscribe((action) => {
      expect(action.type).toBe('NOOP');
      done();
    });
  });
});

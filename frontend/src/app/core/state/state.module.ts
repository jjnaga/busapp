import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { rootEffects } from './root.effects';
import { vehiclesReducer } from './lib/vehicles/vehicles.reducers';
import { stopsReducer } from './lib/stops/stops.reducers';
import { userReducer } from './lib/user/user.reducers';
import { userLocationReducer } from './lib/user-location/user-location.reducers';

@NgModule({
  imports: [
    StoreModule.forFeature('vehicles', vehiclesReducer),
    StoreModule.forFeature('stops', stopsReducer),
    StoreModule.forFeature('user', userReducer),
    StoreModule.forFeature('user-location', userLocationReducer),
    EffectsModule.forFeature(rootEffects),
  ],
})
export class StateModule {}

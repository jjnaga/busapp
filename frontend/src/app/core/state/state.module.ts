import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { rootEffects } from './root.effects';
import { vehiclesReducer } from './lib/vehicles/vehicles.reducers';

@NgModule({
  imports: [
    StoreModule.forFeature('vehicles', vehiclesReducer),
    EffectsModule.forFeature(rootEffects),
  ],
})
export class StateModule {}

import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { rootReducer } from './root.reducer';
import { EffectsModule } from '@ngrx/effects';
import { rootEffects } from './root.effects';

@NgModule({
  imports: [
    StoreModule.forFeature('root', rootReducer),
    EffectsModule.forFeature(rootEffects),
  ],
})
export class StateModule {}

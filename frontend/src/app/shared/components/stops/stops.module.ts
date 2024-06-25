import { NgModule } from '@angular/core';
import { StopsComponent } from './stops.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [StopsComponent],
  imports: [CommonModule],
  exports: [StopsComponent],
})
export class StopsModule {}

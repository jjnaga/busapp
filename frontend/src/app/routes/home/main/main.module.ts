import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
// import { MainRoutingModule } from './main-routing.module';

@NgModule({
  declarations: [MainComponent],
  imports: [CommonModule],
  providers: [provideHttpClient(withInterceptorsFromDi())],
  bootstrap: [MainComponent],
})
export class HomeModule {}

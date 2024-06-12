import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NagahamaComponent } from './routes/nagahama/nagahama.component';
import { MainComponent } from './routes/home/main/main.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./routes/home/main/main.module').then(
        (module) => module.HomeModule
      ),
    // component: MainComponent,
  },
  { path: 'info', component: NagahamaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

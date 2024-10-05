import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NagahamaComponent } from './routes/nagahama/nagahama.component';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./routes/main/main.component').then(
        (module) => module.MainComponent
      ),
  },
  { path: 'info', component: NagahamaComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Catch-all route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

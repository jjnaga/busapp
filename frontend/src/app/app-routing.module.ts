import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NagahamaComponent } from './routes/nagahama/nagahama.component';
import { MainModule } from './routes/home/main/main.module';

// const routes: Routes = [
//   { path: '', component: MainComponent },
//   { path: '**', redirectTo: '', pathMatch: 'full' },

//   // { path: 'info', component: NagahamaComponent },
// ];

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./routes/home/main/main.module').then(
        (module) => module.MainModule
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

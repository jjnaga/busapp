import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './routes/home/main/main.component';
import { NagahamaComponent } from './routes/nagahama/nagahama.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'info', component: NagahamaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

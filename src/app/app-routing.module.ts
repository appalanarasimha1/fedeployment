import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';


const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'search', loadChildren: () => import('./search/search.module').then(m => m.SearchModule)},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

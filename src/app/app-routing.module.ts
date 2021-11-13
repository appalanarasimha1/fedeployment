import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';


const routes: Routes = [
  {path: '', loadChildren: () => import('./search/search.module').then(m => m.SearchModule)},
  {path: 'login', component: LoginComponent},
  {path: 'browse', loadChildren: () => import('./browse/browse.module').then(m => m.BrowseModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

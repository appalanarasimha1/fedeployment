import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TermsOfUseComponent } from '../terms-of-use/terms-of-use.component';


const routes: Routes = [
  {path: 'terms', component: TermsOfUseComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommonRoutingModule { }

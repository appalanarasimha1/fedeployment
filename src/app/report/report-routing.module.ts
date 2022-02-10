import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportMainComponent } from './main/main.component';


const routes: Routes = [
  {path: '', component: ReportMainComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }

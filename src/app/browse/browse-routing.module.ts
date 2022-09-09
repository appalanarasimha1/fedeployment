import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowseComponent } from './browse/browse.component';


const routes: Routes = [
  {path: '', component: BrowseComponent},
  {path: ':sectorName/:folderId', component: BrowseComponent},
  {path: ':sectorName', component: BrowseComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BrowseRoutingModule { }

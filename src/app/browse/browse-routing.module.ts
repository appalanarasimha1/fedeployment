import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowseHomeComponent } from './browse-home/browse-home.component';
import { BrowseSectorFolderComponent } from './browse-sector-folder/browse-sector-folder.component';
import { BrowseSectorDetailComponent } from './browse-sector-space/browse-sector-detail.component';
import { BrowseComponent } from './browse/browse.component';


const routes: Routes = [
  {
    path: '', component: BrowseComponent,
    children: [
      {path: '', component: BrowseHomeComponent},
      {path: ':sectorName', component: BrowseSectorDetailComponent},
      {path: ':sectorName/:folderId', component: BrowseSectorFolderComponent}
    ]
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BrowseRoutingModule { }

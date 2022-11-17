import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowseHomeComponent } from './browse-home/browse-home.component';
import { BrowseSectorFolderComponent } from './browse-sector-folder/browse-sector-folder.component';
import { BrowseSectorDetailComponent } from './browse-sector-space/browse-sector-detail.component';
import { BrowseComponent } from './browse/browse.component';
import { TrashViewComponent } from './trash-view/trash-view.component';


const routes: Routes = [
  {
    path: '', component: BrowseComponent,
    children: [
      {path: '', component: BrowseHomeComponent},
      {path: 'trash', component: TrashViewComponent},
      {path: ':sectorName', component: BrowseSectorDetailComponent},
      {path: ':sectorName/:folderId', component: BrowseSectorDetailComponent}
    ]
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BrowseRoutingModule { }

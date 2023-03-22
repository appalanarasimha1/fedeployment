import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DocumentationAssetsComponent } from '../documentation-assets/documentation-assets.component';
import { SearchComponent } from './search/search.component';


const routes: Routes = [
  {path: '', component: SearchComponent,
  children: [
    {path: 'documentation-assets', component: DocumentationAssetsComponent}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SearchRoutingModule { }

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { BrowseComponent } from './browse/browse.component';
import { BrowseRoutingModule } from './browse-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxMasonryModule } from 'ngx-masonry';
import { TreeModule } from 'angular-tree-component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faBars, faList, faBorderAll, faFolder, faImage, faDownload, faStar, faPlusCircle, faCheckCircle, faAngleDown, faAngleRight, faFolderOpen, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatPaginatorModule} from '@angular/material/paginator';
@NgModule({
  declarations: [
    BrowseComponent,
  ],
  imports: [
    SharedModule,
    TreeModule.forRoot(),
    BrowseRoutingModule,
    NgxDropzoneModule,
    NgMultiSelectDropDownModule.forRoot(),
    NgxMasonryModule,
    // NgxMasonryModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FontAwesomeModule,
    MatPaginatorModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    // CookieService,
    {
      provide: MatDialogRef,
      useValue: {}
    },
   ],
})
export class BrowseModule {
  constructor(private library: FaIconLibrary) {
    library.addIcons(faBars, faList, faBorderAll, faFolder, faImage, faDownload, faStar, faPlusCircle, faCheckCircle, faAngleDown, faAngleRight, faFolderOpen, faUserCircle);
  }
}

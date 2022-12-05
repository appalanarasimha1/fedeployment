import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxMasonryModule } from 'ngx-masonry';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faBars, faList, faBorderAll, faFolder, faImage, faDownload, faStar, faPlusCircle, faCheckCircle, faAngleDown, faAngleRight, faFolderOpen, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { UploadModalModule } from '../upload-modal/upload-modal.module';
import { SearchModule } from '../search/search.module';

import { MatMenuModule } from '@angular/material/menu';
import { ManageSuppliersComponent } from './manage-suppliers/manage-suppliers.component';
import { ManageLocationsComponent } from './manage-locations/manage-locations.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CreateSupplieModalComponent } from './create-supplie-modal/create-supplie-modal.component';

@NgModule({
  declarations: [
    SettingsComponent,
    ManageSuppliersComponent,
    ManageLocationsComponent,
    CreateSupplieModalComponent,
  ],
  imports: [
    SharedModule,
    SettingsRoutingModule,
    NgxDropzoneModule,
    NgMultiSelectDropDownModule.forRoot(),
    NgxMasonryModule,
    // NgxMasonryModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FontAwesomeModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatDatepickerModule,
    UploadModalModule,
    SearchModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatChipsModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
  ],
  exports: [
    MatMenuModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    // CookieService,
    {
      provide: MatDialogRef,
      useValue: {}
    },
    { provide: MAT_DIALOG_DATA, useValue: {} },
   ],
})
export class SettingsModule {
  constructor(private library: FaIconLibrary) {
    library.addIcons(faBars, faList, faBorderAll, faFolder, faImage, faDownload, faStar, faPlusCircle, faCheckCircle, faAngleDown, faAngleRight, faFolderOpen, faUserCircle);
  }
}

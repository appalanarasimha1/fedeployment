import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderComponent } from '../common/loader/loader.component';
import { ApiService } from '../services/api.service';
import { SharedService } from '../services/shared.service';
import { DataService } from '../services/data.service';
import { LoaderSmallComponent } from '../common/loader-small/loader-small.component';
// import {UploadModalModule} from '../upload-modal/upload-modal.module'
import { NgxMasonryModule } from 'ngx-masonry';
// import { OwlModule  } from 'ngx-owl-carousel-o';
import { DocumentCardComponent } from '../document-card/document-card.component';
import { PreviewPopupComponent } from '../preview-popup/preview-popup.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import {SecurePipe} from '../common/pipe/secure.pipe';
import { InterceptorService } from '../services/http-interceptor.service';
import {MatStepperModule} from '@angular/material/stepper';
import { ReversePipe } from '../common/pipe/reverse.pipe';
import { ChartsModule } from 'ng2-charts';
import { SearchPipe } from '../common/pipe/search.pipe';
import {MatSortModule} from '@angular/material/sort';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { SnackbarComponent } from '../common/snackbar/snackbar.component';
import { AssetViewComponent } from '../asset-view/asset-view.component';
import { ManageAccessModalComponent } from '../manage-access-modal/manage-access-modal.component';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { polyfill as keyboardEventKeyPolyfill } from 'keyboardevent-key-polyfill';
import { TextInputAutocompleteModule } from 'angular-text-input-autocomplete';
import { DataTableComponent } from '../browse/data-table/data-table.component';
import { MatMenuModule } from '@angular/material/menu';
import { SafePipe } from '../common/pipe/safe.pipe';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MasonryViewComponent } from '../masonry-view/masonry-view.component';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgSelectModule } from '@ng-select/ng-select';
import { ShareModalComponent } from '../share-modal/share-modal.component';
import { ArcGisMapComponent } from '../arc-gis-map/arc-gis-map.component';

keyboardEventKeyPolyfill();
@NgModule({
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false }
    }
    // {
    //   provide: MatDialogRef,
    //   useValue: {}
    // },
  ],
  declarations: [
    LoaderComponent,
    LoaderSmallComponent,
    DocumentCardComponent,
    PreviewPopupComponent,
    SecurePipe,
    ReversePipe,
    SearchPipe,
    SnackbarComponent,
    AssetViewComponent,
    ManageAccessModalComponent,
    DataTableComponent,
    SafePipe,
    MasonryViewComponent,

    AddUserModalComponent,
    DataTableComponent,
    SafePipe,
    MasonryViewComponent,
    ShareModalComponent,
    ArcGisMapComponent,
    
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    NgbModule,
    MatPaginatorModule,
    PdfViewerModule,
    MatStepperModule,
    ChartsModule,
    MatSnackBarModule,
    TextInputAutocompleteModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    NgSelectModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    PdfViewerModule,
    ReactiveFormsModule,
    NgbModule,
    
    // MatDialogModule,
    LoaderComponent,
    LoaderSmallComponent,
    DocumentCardComponent,
    PreviewPopupComponent,
    MatStepperModule,
    MatPaginatorModule,
    ReversePipe,
    ChartsModule,
    SearchPipe,
    // NgxMasonryModule
    // OwlModule
    MatSortModule,
    MatSnackBarModule,
    SnackbarComponent,
    AssetViewComponent,
    MatMenuModule,
    DataTableComponent,
    ManageAccessModalComponent,
    // ManageAccessModalComponent,
    SafePipe,
    MasonryViewComponent
  ]
})
export class SharedModule { }

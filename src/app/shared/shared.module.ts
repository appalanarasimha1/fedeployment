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
import {SecurePipe} from '../services/secure.pipe';
import { InterceptorService } from '../services/http-interceptor.service';

@NgModule({
  providers: [
  ],
  declarations: [
    LoaderComponent,
    LoaderSmallComponent,
    DocumentCardComponent,
    PreviewPopupComponent,
    SecurePipe,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    PdfViewerModule,
    // UploadModalModule,
    // NgxMasonryModule
  ],
  exports: [
    CommonModule,
    PdfViewerModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    LoaderComponent,
    LoaderSmallComponent,
    DocumentCardComponent,
    PreviewPopupComponent
    // NgxMasonryModule
    // OwlModule
  ]
})
export class SharedModule { }

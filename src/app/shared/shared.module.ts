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
import { UploadModalComponent } from '../upload-modal/upload-modal.component';

@NgModule({
  providers: [
  ],
  declarations: [
    LoaderComponent,
    LoaderSmallComponent,
    // UploadModalComponent,
    DocumentCardComponent,
    PreviewPopupComponent,
    SecurePipe,
    ReversePipe,
    SearchPipe,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    PdfViewerModule,
    MatStepperModule,
    ChartsModule
    // UploadModalModule,
    // NgxMasonryModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    PdfViewerModule,
    ReactiveFormsModule,
    NgbModule,
    LoaderComponent,
    LoaderSmallComponent,
    DocumentCardComponent,
    PreviewPopupComponent,
    // UploadModalComponent,
    MatStepperModule,
    ReversePipe,
    ChartsModule,
    SearchPipe,
    // NgxMasonryModule
    // OwlModule
  ]
})
export class SharedModule { }

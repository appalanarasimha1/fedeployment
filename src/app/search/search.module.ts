import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchComponent } from './search/search.component';
import { SideDrawerComponent } from '../common/sideDrawer/sideDrawer.component';
import { SubHeaderComponent } from '../common/subHeader/subHeader.component';
import { DocumentComponent } from '../document/document.component';
import { SharedModule } from '../shared/shared.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxMasonryModule } from 'ngx-masonry';
// import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
// import { HttpInterceptorService } from '../services/http-interceptor.service';
// import { NuxeoService } from '../services/nuxeo.service';
import { CarouselModule  } from 'ngx-owl-carousel-o';
import { SafePipe } from '../shared/safe.pipe';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  declarations: [
    SearchComponent,
    SideDrawerComponent,
    SubHeaderComponent,
    DocumentComponent,
    SafePipe
  ],
  imports: [
    // HttpClientModule,
    SharedModule,
    SearchRoutingModule,
    NgMultiSelectDropDownModule.forRoot(),
    NgxMasonryModule,
    CarouselModule,
    PdfViewerModule
  ],
  // providers: [NuxeoService, { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true}]
})
export class SearchModule { }

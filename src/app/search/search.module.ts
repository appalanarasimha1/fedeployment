import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchComponent } from './search/search.component';
import { SideDrawerComponent } from '../common/sideDrawer/sideDrawer.component';
import { SubHeaderComponent } from '../common/subHeader/subHeader.component';
import { DocumentComponent } from '../document/document.component';
import { SharedModule } from '../shared/shared.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxMasonryModule } from 'ngx-masonry';
import { NgSelectModule } from '@ng-select/ng-select';
// import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
// import { HttpInterceptorService } from '../services/http-interceptor.service';
// import { NuxeoService } from '../services/nuxeo.service';
import { CarouselModule  } from 'ngx-owl-carousel-o';
import { SlickCarouselModule } from 'ngx-slick-carousel';

@NgModule({

  imports: [
    // HttpClientModule,
    NgSelectModule,
    NgxMasonryModule,
    SharedModule,
    SearchRoutingModule,
    NgMultiSelectDropDownModule.forRoot(),
    CarouselModule,
    SlickCarouselModule,
  ],
  declarations: [
    SearchComponent,
    SideDrawerComponent,
    SubHeaderComponent,
    DocumentComponent
  ],
  schemas: [
      CUSTOM_ELEMENTS_SCHEMA,
      NO_ERRORS_SCHEMA
    ]
  // providers: [NuxeoService, { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true}]
})
export class SearchModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchComponent } from './search/search.component';
import { SideDrawerComponent } from '../common/sideDrawer/sideDrawer.component';
import { SubHeaderComponent } from '../common/subHeader/subHeader.component';
import { DocumentComponent } from '../document/document.component';
import { SharedModule } from '../shared/shared.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from '../services/http-interceptor.service';


@NgModule({
  declarations: [
    SearchComponent,
    SideDrawerComponent,
    SubHeaderComponent,
    DocumentComponent
  ],
  imports: [
    SharedModule,
    SearchRoutingModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true }]
})
export class SearchModule { }

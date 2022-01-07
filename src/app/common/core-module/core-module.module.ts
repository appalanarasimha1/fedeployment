import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { SharedService } from '../../services/shared.service';
import { DataService } from '../../services/data.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { InterceptorService } from '../../services/http-interceptor.service';
import { NuxeoService } from '../../services/nuxeo.service';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    ApiService,
    SharedService,
    DataService,
    NuxeoService,
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }]
})
export class CoreModuleModule { }

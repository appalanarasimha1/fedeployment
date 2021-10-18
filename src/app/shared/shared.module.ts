import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { LoaderComponent } from '../common/loader/loader.component';
import { ApiService } from '../services/api.service';
import { SharedService } from '../services/shared.service';
import { DataService } from '../services/data.service';
import { LoaderSmallComponent } from '../common/loader-small/loader-small.component';
// import { OwlModule  } from 'ngx-owl-carousel-o';

@NgModule({
  declarations: [
    LoaderComponent,
    LoaderSmallComponent
  ],
  providers: [
    ApiService,
    SharedService,
    DataService
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    LoaderComponent,
    LoaderSmallComponent
    // OwlModule
  ]
})
export class SharedModule { }

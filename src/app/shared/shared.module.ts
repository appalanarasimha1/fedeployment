import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { LoaderComponent } from '../common/loader/loader.component';
import { ApiService } from '../services/api.service';


@NgModule({
  declarations: [
    LoaderComponent
  ],
  providers: [
    ApiService
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
    LoaderComponent
  ]
})
export class SharedModule { }

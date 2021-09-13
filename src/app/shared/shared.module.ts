import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdown, NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [],
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
    NgbModule
  ]
})
export class SharedModule { }

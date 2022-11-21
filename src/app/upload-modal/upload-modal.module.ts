import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxDropzoneModule } from "ngx-dropzone";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from '@angular/material/core';
import { UploadModalComponent } from "./upload-modal.component";
import { SharedModule } from "../shared/shared.module";
import { MatInputModule } from '@angular/material/input';
import {MatStepperModule} from '@angular/material/stepper';
import {MatExpansionModule} from '@angular/material/expansion';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { ClickOutsideDirective } from './clickoutside.directive';
@NgModule({
  declarations: [UploadModalComponent, ClickOutsideDirective],
  imports: [
    SharedModule,
    // CommonModule,
    // FormsModule,
    NgxDropzoneModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgSelectModule,
    MatInputModule,
    // MatStepperModule,
    MatExpansionModule,
    SlickCarouselModule
  ],
  exports: [UploadModalComponent]
})
export class UploadModalModule {}

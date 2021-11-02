import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxDropzoneModule } from "ngx-dropzone";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from '@angular/material/core';
import { UpdateModalComponent } from "./update-modal.component";
import { SharedModule } from "../shared/shared.module";

@NgModule({
  declarations: [UpdateModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgxDropzoneModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgSelectModule,
    SharedModule
  ],
})
export class UpdateModalModule {}

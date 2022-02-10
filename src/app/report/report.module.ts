import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportMainComponent } from './main/main.component';
import { CardComponent } from './card/card.component';
import { GraphComponent } from './graph/graph.component';



@NgModule({
  declarations: [ReportMainComponent, CardComponent, GraphComponent],
  imports: [
    CommonModule
  ]
})
export class ReportModule { }

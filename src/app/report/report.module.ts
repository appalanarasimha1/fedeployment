import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportMainComponent } from './main/main.component';
import { CardComponent } from './card/card.component';
import { GraphComponent } from './graph/graph.component';
import { ReportRoutingModule } from './report-routing.module';
import { SharedModule } from '../shared/shared.module';
import { TableCardComponent } from './table-card/table-card.component';
@NgModule({
  declarations: [
    ReportMainComponent,
    CardComponent,
    GraphComponent,
    TableCardComponent],
  imports: [
    SharedModule,
    ReportRoutingModule
  ]
})
export class ReportModule { }

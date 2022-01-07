import { NgModule } from '@angular/core';
import { TermsOfUseComponent } from '../terms-of-use/terms-of-use.component';
import { SharedModule } from '../../shared/shared.module';
import { CommonRoutingModule } from './common-routing.module';



@NgModule({
  declarations: [
    TermsOfUseComponent
  ],
  imports: [
    SharedModule,
    CommonRoutingModule
  ]
})
export class CommonModule { }

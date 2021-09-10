import { BrowserModule } from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
// import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './common/header/header.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { NgModule,NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { SideDrawerComponent } from './common/sideDrawer/sideDrawer.component';

@NgModule({
  declarations: [
    
    AppComponent,
    HeaderComponent,
    
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    NgbModule,
  ],
  schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
        NO_ERRORS_SCHEMA
      ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

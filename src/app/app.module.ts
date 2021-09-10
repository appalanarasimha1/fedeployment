import { BrowserModule } from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
// import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './common/header/header.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { SharedModule } from './shared/shared.module';
// import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { NgModule } from '@angular/core';
// import { SideDrawerComponent } from './common/sideDrawer/sideDrawer.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    SharedModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

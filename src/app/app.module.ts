import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './common/header/header.component';
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { SharedModule } from './shared/shared.module';
// import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { InterceptorService } from './services/http-interceptor.service';
import { NuxeoService } from './services/nuxeo.service';
import { LandingPageComponent } from './landing-page/landing-page.component';
// import { CookieService } from 'ngx-cookie-service';
import { FooterComponent } from './common/footer/footer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderSmallComponent } from './common/loader-small/loader-small.component';
import { UploadModalModule } from './upload-modal/upload-modal.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UpdateModalModule } from './update-modal/update-modal.module';
import { LoaderYellowComponent } from './common/loader-yellow/loader-yellow.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DataService } from './services/data.service';
import { CoreModuleModule } from './common/core-module/core-module.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    LandingPageComponent,
    FooterComponent,
    LoaderYellowComponent,
  ],
  imports: [
    CommonModule,
    CoreModuleModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    UploadModalModule,
    UpdateModalModule,
    NgSelectModule
  ],
  providers: [
    // CookieService,
    // DataService,
    // NuxeoService,
    // { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

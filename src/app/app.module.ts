import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './common/header/header.component';
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { SharedModule } from './shared/shared.module';
// import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
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
import { TermsOfUseComponent } from './common/terms-of-use/terms-of-use.component';
import { initializer } from './AppInit';
import { RoleGuardService } from './services/roleGaurd';
import { AuthGuardService } from './services/authGaurd';
import { ManageAccessModalComponent } from './manage-access-modal/manage-access-modal.component';
import { AddUserModalComponent } from './add-user-modal/add-user-modal.component';
// import { AssetViewComponent } from './asset-view/asset-view.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { SignupComponent } from './signup/signup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AssetCannotBeAccessedComponent } from './asset-cannot-be-accessed/asset-cannot-be-accessed.component';

import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditAccessComponent } from './edit-access/edit-access.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    LandingPageComponent,
    FooterComponent,
    LoaderYellowComponent,
    ManageAccessModalComponent,
    AddUserModalComponent,
    SignupComponent,
    ForgotPasswordComponent,
    AssetCannotBeAccessedComponent,
    EditAccessComponent,
    // AssetViewComponent,
  ],
  imports: [
    // CommonModule,
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
    NgSelectModule,
    KeycloakAngularModule,
    SlickCarouselModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatNativeDateModule,
  ],
  providers: [
    // CookieService,
    // DataService,
    // NuxeoService,
    // { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }
    NuxeoService,
    // { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
      deps: [KeycloakService],
    },
    RoleGuardService,
    AuthGuardService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

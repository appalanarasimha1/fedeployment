import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { TermsOfUseComponent } from "./common/terms-of-use/terms-of-use.component";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { LoginComponent } from "./login/login.component";
import { RoleGuardService } from "./services/roleGaurd";
import { NoContent } from "./no-content";
import { AuthGuardService } from "./services/authGaurd";
import { AuthGuard } from './auth/auth.guard';


const routes: Routes = [
  {
    path: "",
    loadChildren: () =>
      import("./search/search.module").then((m) => m.SearchModule),
    canActivate: [AuthGuardService],
  },
  { path: "login", component: LoginComponent },
  {
    path: "workspace",
    loadChildren: () =>
      import("./browse/browse.module").then((m) => m.BrowseModule),
    canActivate: [AuthGuard, AuthGuardService],
  },
  {
    path: "common",
    loadChildren: () =>
      import("./common/common-module/common.module").then(
        (m) => m.CommonModule
      ),
  },
  {
    path: "report",
    loadChildren: () =>
      import("./report/report.module").then((m) => m.ReportModule),
    canActivate: [RoleGuardService],
    data: {
      expectedRole: "reportAdmin",
    },
  },
  { path: "**", component: NoContent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: "enabled",
      onSameUrlNavigation: "reload",
      scrollPositionRestoration: "enabled",
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
